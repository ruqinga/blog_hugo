---
title: 个人博客搭建：hugo+github+picgo+github_action
date: 2025-09-01
categories:
  - 环境配置
enableMath: true
comments: true
toc: true
---

之前博客没能持续更新，主要是更新步骤太繁琐了：
1.本地写好 md 文件
2.picgo 上传图片至github
3.hugo build 生成静态网页需要的 ./public
4.git push

这次更新，将hugo build简化成github_action自动构建并推送，git push 通过pycharm，更直观

<!--more-->

## 第一关：软件安装

### 安装操作软件 — git

用于执行hugo命令以及上传博客 | [相关介绍](https://www.liaoxuefeng.com/wiki/896043488029600)

1.官网[下载](https://git-scm.com/)对应版本
2.安装
参考：[Git安装教程（Windows安装超详细教程）](https://www.jianshu.com/p/414ccd423efc)
3.配置
在命令行输入

```bash
$ git config --global user.name "Your Name"
$ git config --global user.email "email@example.com"
```

> `--global`参数表示会在这台机器上的所有git仓库使用该配置

### 安装博客生成软件 — hugo

1. github上[下载](https://github.com/gohugoio/hugo/releases)对应版本
2. 解压，得到`.exe`文件
3. 配置到PATH: Windows 搜索环境变量，将`.exe`文件路径保存到环境变量PATH

## 第二关：生成本地博客

### 基础框架

**新建博客**

想要存放博客的地方，右键点击git bash here,输入`hugo new site blog`，就会生成一个文件夹

**下载主题**

在官网[Hugo Themes](https://themes.gohugo.io/)选择想要的主题，会链接到github下载相应主题的zip文件，解压后放到blog的theme文件夹中

**生成网站**

根据不同主题的使用说明，进行操作，eg:将examplesite文件里的内容替换到blog里

运行`hugo server`，浏览器中打开 http://localhost:1313/ 查看效果

**拓展**

帮助文档：https://hexo.io/zh-cn/docs/

```bash
layout: false #草稿，不渲染
hugo server -D #渲染草稿文件
```

### 个性设计

内容较多，考虑另开一篇

## 第三关：将本地博客部署到服务器

### github建仓

girhub 新建仓库，命名方式为

```bash
<你的github用户名>.github.io
# 例如我的：ruqinga.github.io
```

### 创建public文件夹

```bash
# 修改config
baseURL: "https://ruqinga.github.io"
# 生成public文件夹
hugo build
```

### 把public与远程github仓库关联

```bash
cd public
git init   // 初始化版本库
ssh-keygen -t rsa -C "你的邮箱" //生成公钥，填到github里 
git add .   // 添加文件到版本库（只是添加到缓存区），.代表添加文件夹下所有文件
git commit -m "first commit" // 把添加的文件提交到版本库，并填写提交备注
git remote add origin git@github.com:<你的github用户名>/<你的github用户名>.github.io.git  // 把本地库与远程库关联
git push -u origin main  // 第一次推送后，直接使用该命令即可推送修改之后可以直接#使用
git push

```

其它操作：

```bash
# 更换远程仓库
git remote rm origin 	//先删除远程 Git 仓库
git remote add origin xx 	//再添加

# 本地仓库与远程仓库不同步，解决方法
## 1. -f强制推送，本地覆盖远程
git push -u origin main -f 
## 2.push前先将远程repository修改pull下来
git pull origin master
git push -u origin master
## 3.若不想merge远程和本地修改，可以先创建新的分支：
git branch [name]	//名字可以随便取，推送时使用同一名字即可
git push -u origin [name]
```

### 查看

命令行上传完毕后，在浏览器网址栏打开链接 `https://<你的github用户名>.github.io/`
就可以看到我们自己的博客了~

## 第四关：搭建远程图床

上传文档后还需要将相应的图片上传，即搭建一个图床，这里我使用的picGo

### 下载-picGo

[下载](https://github.com/Molunerfinn/PicGo/releases)对应版本(windows是`exe`)并安装到本地

### GitHub建仓

1. 仓库权限为**开放**
2. **创建token**：点击github头像，找到settings，找到开发者设置（Developer settings），找到个人访问token，然后点击创建新的token

### 配置picGo

1. 配置github图床：插件 ->github plus-> 完成下方配置

   ![image-20230219111906058](https://raw.githubusercontent.com/ruqinga/picture/main/2023/02/202302191144238.png)

2. picgo 设置 -> 设置serve -> 监听端口设为36677 (typora的接口)

### 配置typora

1. 偏好设置 -> 图象 -> 找到picgo位置

   ![image-20230219105200375](https://raw.githubusercontent.com/ruqinga/picture/main/2023/02/202302191144239.png)

2. 报错，截图无法成功上传，日志文件中显示，picgo无法正确读取图像。

   ![image-20230219104719671](https://raw.githubusercontent.com/ruqinga/picture/main/2023/02/202302191144240.png)

   目前还没有找到原因，替换方案是，不直接上传，而是将图象复制到其它文件夹，然后上传
   
   - <img src="https://raw.githubusercontent.com/ruqinga/picture/main/2023/02/202302191144242.png" alt="image-20230219105920127" style="zoom:50%;" />
   - <img src="https://raw.githubusercontent.com/ruqinga/picture/main/2023/02/202302191144243.png" alt="image-20230219110101171" style="zoom:50%;" />

### github加速

一方面是加速，一方面`raw.githubusercontent.com`域名解析被污染了，不更改会导致上传图片无法显示 

1. 在[https://www.ipaddress.com](https://www.ipaddress.com/)首页搜索`raw.githubusercontent.com`，查询真实的ip地址

![image-20230219112428281](https://raw.githubusercontent.com/ruqinga/picture/main/2023/02/202302191144244.png)

2. 鼠标右键点击桌面左下角的开始菜单，选择Windows PowerShell（管理员）
3. 在打开的 窗口中输入notepad, 回车, 会打开记事本
4. 选择文件 -> 打开
5. 在弹出的文件选择窗口中, 选择 C:\Windows\System32\drivers\etc\hosts
6. 在最底下添加该内容即可

> 185.199.108.133 raw.githubusercontent.com
>
> 185.199.109.133 raw.githubusercontent.com
>
> 185.199.110.133 raw.githubusercontent.com
>
> 185.199.111.133 raw.githubusercontent.com
>
> 2606:50c0:8000::154 raw.githubusercontent.com
>
> 2606:50c0:8001::154 raw.githubusercontent.com
>
> 2606:50c0:8002::154 raw.githubusercontent.com
>
> 2606:50c0:8003::154 raw.githubusercontent.com

7. 刷新：win+r -> cmd -> ipconfig/flushdns -> 回车

## 第五关：github action自动部署

### 将 hugo 需要的源码推送到GitHub仓库 

方式同上，我将其命名为 blog_hugo
### 添加 GitHub Actions Workflow

在blog_hubo仓库中点击 `Action` → `New workflow` → `set up a workflow yourself`

然后将下面的内容粘贴进去

```txt
name: Build and Deploy Hugo to ruqinga.github.io

on:
  push:
    branches: ["main"]
  workflow_dispatch:

jobs:
  build-deploy:
    runs-on: ubuntu-latest
    env:
      HUGO_VERSION: 0.137.1
    steps:
      - name: Checkout source
        uses: actions/checkout@v4
        with:
          submodules: recursive

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'

      - name: Install Hugo
        run: |
          wget -O ${{ runner.temp }}/hugo.deb https://github.com/gohugoio/hugo/releases/download/v${HUGO_VERSION}/hugo_extended_${HUGO_VERSION}_linux-amd64.deb \
          && sudo dpkg -i ${{ runner.temp }}/hugo.deb

      - name: Install dependencies
        run: |
          npm install postcss-cli tailwindcss autoprefixer cssnano @tailwindcss/typography
          cd themes/hugo-eureka && npm install

      - name: Build with Hugo
        run: hugo --minify

      - name: Deploy to ruqinga.github.io
        uses: peaceiris/actions-gh-pages@v4
        with:
          external_repository: ruqinga/ruqinga.github.io
          publish_branch: main   # 或者 gh-pages
          publish_dir: ./public
          personal_token: ${{ secrets.PERSONAL_TOKEN }}

```

需要更改的是最后面的
```
        with:
          external_repository: ruqinga/ruqinga.github.io #你的博客路径
          publish_branch: main   # 你的博客使用的分支
          personal_token: ${{ secrets.PERSONAL_TOKEN }} # 创建PERSONAL_TOKEN，后面会讲到
```

### 创建PERSONAL_TOEKN的 secret

生成 Personal Access Token（PAT）
1. 打开 [GitHub Token生成页面](https://github.com/settings/tokens)。
2. 点击右上角 `Generate new token` 按钮（或 `Fine-grained tokens`，推荐选择 classic）。
3. 输入 token 名称，选择过期时间。
4. 权限选择：
    - 至少勾选 `repo` 权限（全部子选项或至少 `public_repo`）。
5. 点击最下方 `Generate token` 按钮。
6. 复制生成的 token（只显示一次！）。

在你的 blog_hugo 仓库添加 secret
1. 打开你的仓库：[ruqinga/blog_hugo](https://github.com/ruqinga/blog_hugo)。
2. 点击顶部菜单栏的 `Settings`。
3. 左侧菜单选择 `Secrets and variables` → `Actions`。
4. 点击右上角 `New repository secret`。
5. **Name** 填写：`PERSONAL_TOKEN`
6. **Value** 粘贴你刚刚复制的 token。
7. 点击 `Add secret`。

## 参考

git 教程： https://www.liaoxuefeng.com/wiki/896043488029600

hugo 安装与部署： https://sspai.com/post/59904

hugo博客搭建： https://www.sulvblog.cn/posts/blog/build_hugo/ 也是一个很厉害的个人博客博主，学习！

picGO+github/gitee图床设置： https://zhuanlan.zhihu.com/p/416251450

