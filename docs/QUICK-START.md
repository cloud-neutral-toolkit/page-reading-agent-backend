# SEO 审计功能快速开始

## 🚀 快速启动

### 1. 启动后端服务

```bash
cd /Users/shenlan/workspaces/cloud-neutral-toolkit/page-reading-agent-backend
node main.js
```

服务将在 `http://localhost:8080` 启动

### 2. 启动前端服务

```bash
cd /Users/shenlan/workspaces/cloud-neutral-toolkit/page-reading-agent-dashboard
npm run dev
```

Dashboard 将在 `http://localhost:3000` 启动

### 3. 使用 SEO 审计

1. 打开浏览器访问 `http://localhost:3000`
2. 在左侧输入要审计的 URL
3. 选择设备类型和区域
4. 点击 "🔍 Run SEO Audit" 按钮
5. 在右侧查看审计结果

## 📖 功能说明

### 审计指标

- **Metadata** (元数据): Title, Description, OG tags, Twitter cards
- **Headings** (标题): H1-H6 结构
- **Images** (图片): Alt text 检查
- **Links** (链接): 死链检测、内外部链接统计
- **Structured Data** (结构化数据): JSON-LD 检测
- **Mobile** (移动端): Viewport, 响应式图片

### 评分标准

- **80-100**: Excellent (优秀)
- **60-79**: Good (良好)
- **40-59**: Needs Improvement (需要改进)
- **0-39**: Poor (较差)

### 问题级别

- **Critical** (严重): 必须修复的问题
- **Warnings** (警告): 应该修复的问题
- **Suggestions** (建议): 可以改进的地方

## 🔧 API 使用

### 直接调用 API

```bash
curl -X POST http://localhost:8080/seo-audit \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://console.svc.plus",
    "device": "mobile",
    "region": "JP"
  }'
```

### 响应示例

```json
{
  "summary": {
    "url": "https://console.svc.plus",
    "overallScore": 85,
    "status": "excellent"
  },
  "issues": {
    "critical": 0,
    "warnings": 2,
    "suggestions": 3
  }
}
```

## 📊 导出报告

### JSON 导出
点击右上角 "JSON" 按钮导出完整数据

### Markdown 导出
点击右上角 "MD" 按钮导出可读报告

## ⚠️ 注意事项

1. 确保目标网站可访问
2. 某些网站可能有反爬虫机制
3. 审计时间取决于页面复杂度 (通常 3-10秒)
4. 建议在非高峰时段进行批量审计

## 🐛 故障排查

### 后端无法启动
```bash
# 检查端口占用
lsof -i :8080

# 安装依赖
npm install
```

### 前端无法连接后端
检查 `.env.local` 文件:
```
AGENT_SERVICE_URL=http://localhost:8080
```

### 审计失败
- 检查目标 URL 是否可访问
- 查看后端日志
- 确认网络连接正常

## 📝 下一步

- 查看完整文档: `docs/SEO-INTEGRATION.md`
- 查看 console.svc.plus 的 SEO 优化: `../../console.svc.plus/docs/SEO-AUDIT-REPORT.md`
