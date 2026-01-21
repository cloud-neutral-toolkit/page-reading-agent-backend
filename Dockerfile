# 必须使用 Playwright 官方镜像以包含浏览器依赖
FROM mcr.microsoft.com/playwright:v1.41.0-jammy

WORKDIR /app

# 1. 安装依赖
COPY package.json .
RUN npm install

# 2. 复制代码
COPY . .

# 3. 强制无头模式
ENV CI=true

# 4. 启动
CMD ["node", "main.js"]
