#!/usr/bin/env node
/**
 * VRM模型批量压缩脚本
 * 批量处理models目录下的所有VRM文件
 * 
 * 使用方法：
 * node batch-optimize.js [options]
 * 
 * 选项：
 *   --input-dir <path>      输入目录 (默认: ../models)
 *   --output-dir <path>     输出目录 (默认: ../models/optimized)
 *   --max-texture-size <n>  最大纹理尺寸 (默认: 1024)
 *   --quality <n>           纹理质量 0-1 (默认: 0.9)
 *   --concurrent <n>        并发数 (默认: 3)
 *   --dry-run               仅显示将要处理的文件，不实际执行
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 默认配置
const DEFAULT_CONFIG = {
  inputDir: path.join(__dirname, '..', 'models'),
  outputDir: path.join(__dirname, '..', 'models', 'optimized'),
  maxTextureSize: 1024,
  quality: 0.9,
  concurrent: 3,
  dryRun: false
};

/**
 * 获取所有VRM文件
 */
function getVRMFiles(dir) {
  const files = [];
  
  if (!fs.existsSync(dir)) {
    console.error(`目录不存在: ${dir}`);
    return files;
  }
  
  const items = fs.readdirSync(dir);
  
  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    
    if (stat.isFile() && item.toLowerCase().endsWith('.vrm')) {
      files.push({
        name: item,
        path: fullPath,
        size: stat.size
      });
    }
  }
  
  return files.sort((a, b) => a.size - b.size); // 从小到大排序，先处理小文件
}

/**
 * 格式化文件大小
 */
function formatSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

/**
 * 处理单个文件
 */
async function processFile(file, config, index, total) {
  const outputPath = path.join(config.outputDir, file.name);
  
  console.log(`\n[${index + 1}/${total}] 处理: ${file.name}`);
  console.log(`  原始大小: ${formatSize(file.size)}`);
  
  if (config.dryRun) {
    console.log(`  [DRY RUN] 将输出到: ${outputPath}`);
    return { success: true, dryRun: true, originalSize: file.size };
  }
  
  try {
    // 构建命令
    const optimizeScript = path.join(__dirname, 'optimize-vrm.js');
    const cmd = `node "${optimizeScript}" "${file.path}" "${outputPath}" --max-texture-size ${config.maxTextureSize} --quality ${config.quality}`;
    
    // 执行优化
    execSync(cmd, { stdio: 'pipe' });
    
    // 获取优化后大小
    const optimizedSize = fs.existsSync(outputPath) ? fs.statSync(outputPath).size : 0;
    const reduction = ((1 - optimizedSize / file.size) * 100).toFixed(1);
    
    console.log(`  优化后大小: ${formatSize(optimizedSize)}`);
    console.log(`  压缩率: ${reduction}%`);
    
    return {
      success: true,
      originalSize: file.size,
      optimizedSize,
      reduction: parseFloat(reduction)
    };
  } catch (error) {
    console.error(`  错误: ${error.message}`);
    return { success: false, error: error.message, originalSize: file.size };
  }
}

/**
 * 并发处理队列
 */
async function processQueue(files, config) {
  const results = [];
  const queue = [...files];
  const running = new Set();
  
  let index = 0;
  
  while (queue.length > 0 || running.size > 0) {
    // 启动新任务直到达到并发限制
    while (running.size < config.concurrent && queue.length > 0) {
      const file = queue.shift();
      const promise = processFile(file, config, index++, files.length)
        .then(result => {
          running.delete(promise);
          return result;
        })
        .catch(error => {
          running.delete(promise);
          return { success: false, error: error.message };
        });
      
      running.add(promise);
      results.push(promise);
    }
    
    // 等待至少一个任务完成
    if (running.size > 0) {
      await Promise.race(running);
    }
  }
  
  return Promise.all(results);
}

/**
 * 生成报告
 */
function generateReport(results, config) {
  const successful = results.filter(r => r.success && !r.dryRun);
  const failed = results.filter(r => !r.success);
  const dryRuns = results.filter(r => r.dryRun);
  
  const totalOriginal = successful.reduce((sum, r) => sum + r.originalSize, 0);
  const totalOptimized = successful.reduce((sum, r) => sum + r.optimizedSize, 0);
  const avgReduction = successful.length > 0
    ? (successful.reduce((sum, r) => sum + r.reduction, 0) / successful.length).toFixed(1)
    : 0;
  
  console.log('\n');
  console.log('========================================');
  console.log('批量优化报告');
  console.log('========================================');
  console.log('');
  console.log(`总文件数: ${results.length}`);
  console.log(`成功: ${successful.length}`);
  console.log(`失败: ${failed.length}`);
  if (dryRuns.length > 0) {
    console.log(`模拟运行: ${dryRuns.length}`);
  }
  console.log('');
  
  if (successful.length > 0) {
    console.log('压缩统计:');
    console.log(`  原始总大小: ${formatSize(totalOriginal)}`);
    console.log(`  优化后总大小: ${formatSize(totalOptimized)}`);
    console.log(`  节省空间: ${formatSize(totalOriginal - totalOptimized)}`);
    console.log(`  总压缩率: ${((1 - totalOptimized / totalOriginal) * 100).toFixed(1)}%`);
    console.log(`  平均压缩率: ${avgReduction}%`);
    console.log('');
  }
  
  if (failed.length > 0) {
    console.log('失败的文件:');
    failed.forEach((f, i) => {
      console.log(`  ${i + 1}. ${f.name || 'Unknown'}: ${f.error}`);
    });
    console.log('');
  }
  
  // 保存详细报告
  const reportPath = path.join(config.outputDir, 'optimization-report.json');
  const report = {
    timestamp: new Date().toISOString(),
    config: {
      maxTextureSize: config.maxTextureSize,
      quality: config.quality
    },
    summary: {
      total: results.length,
      successful: successful.length,
      failed: failed.length,
      totalOriginalSize: totalOriginal,
      totalOptimizedSize: totalOptimized,
      spaceSaved: totalOriginal - totalOptimized,
      compressionRatio: successful.length > 0 ? ((1 - totalOptimized / totalOriginal) * 100).toFixed(1) : 0
    },
    results: results.map((r, i) => ({
      index: i + 1,
      ...r
    }))
  };
  
  if (!config.dryRun) {
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`详细报告已保存至: ${reportPath}`);
  }
}

/**
 * 主函数
 */
async function main() {
  const args = process.argv.slice(2);
  const config = { ...DEFAULT_CONFIG };
  
  // 解析参数
  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--input-dir':
        config.inputDir = args[++i];
        break;
      case '--output-dir':
        config.outputDir = args[++i];
        break;
      case '--max-texture-size':
        config.maxTextureSize = parseInt(args[++i]);
        break;
      case '--quality':
        config.quality = parseFloat(args[++i]);
        break;
      case '--concurrent':
        config.concurrent = parseInt(args[++i]);
        break;
      case '--dry-run':
        config.dryRun = true;
        break;
      case '--help':
      case '-h':
        console.log('用法: node batch-optimize.js [options]');
        console.log('');
        console.log('选项:');
        console.log('  --input-dir <path>      输入目录 (默认: ../models)');
        console.log('  --output-dir <path>     输出目录 (默认: ../models/optimized)');
        console.log('  --max-texture-size <n>  最大纹理尺寸 (默认: 1024)');
        console.log('  --quality <n>           纹理质量 0-1 (默认: 0.9)');
        console.log('  --concurrent <n>        并发数 (默认: 3)');
        console.log('  --dry-run               仅显示将要处理的文件');
        console.log('  --help, -h              显示帮助');
        process.exit(0);
    }
  }
  
  console.log('========================================');
  console.log('VRM模型批量压缩工具');
  console.log('========================================');
  console.log('');
  console.log('配置:');
  console.log(`  输入目录: ${config.inputDir}`);
  console.log(`  输出目录: ${config.outputDir}`);
  console.log(`  最大纹理尺寸: ${config.maxTextureSize}`);
  console.log(`  纹理质量: ${config.quality}`);
  console.log(`  并发数: ${config.concurrent}`);
  console.log(`  模拟运行: ${config.dryRun ? '是' : '否'}`);
  console.log('');
  
  // 获取所有VRM文件
  const files = getVRMFiles(config.inputDir);
  
  if (files.length === 0) {
    console.log('未找到VRM文件');
    process.exit(1);
  }
  
  console.log(`找到 ${files.length} 个VRM文件`);
  console.log('');
  
  // 显示文件列表
  console.log('文件列表:');
  files.forEach((f, i) => {
    console.log(`  ${i + 1}. ${f.name} (${formatSize(f.size)})`);
  });
  console.log('');
  
  // 创建输出目录
  if (!config.dryRun) {
    if (!fs.existsSync(config.outputDir)) {
      fs.mkdirSync(config.outputDir, { recursive: true });
      console.log(`创建输出目录: ${config.outputDir}`);
    }
  }
  
  // 确认
  if (!config.dryRun) {
    console.log('');
    console.log('按 Ctrl+C 取消，或等待 3 秒后开始处理...');
    await new Promise(resolve => setTimeout(resolve, 3000));
  }
  
  // 处理文件
  console.log('\n开始处理...');
  const startTime = Date.now();
  const results = await processQueue(files, config);
  const duration = ((Date.now() - startTime) / 1000).toFixed(1);
  
  console.log(`\n处理完成，耗时: ${duration} 秒`);
  
  // 生成报告
  generateReport(results, config);
}

main().catch(error => {
  console.error('错误:', error);
  process.exit(1);
});
