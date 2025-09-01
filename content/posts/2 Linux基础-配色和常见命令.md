---
title: Linux基础-配色和常见命令
date: 2022-08-28
categories:
  - Linux
enableMath: true
comments: true
toc: true
tags:
  - 进度/4-已完成
---

以下内容为基础的linux操作，需要熟练掌握

<!--more-->

### 命令行配色方案

这个看个人审美，你们也可以自己配置

```
echo  'export PS1="\[\033]2;\h:\u \w\007\033[33;1m\]\u \033[35;1m\t\033[0m \[\033[36;1m\]\w\[\033[0m\]\n\[\e[32;1m\]$ \[\e[0m\]"' >> ~/.bashrc
source  ~/.bashrc
```

## 常见命令

更多见：[Linux命令大全](http://man.linuxde.net/)

### 查看帮助文档

man 命令，help 命令，或者某个命令的  --help  参数

```sh
man  ls		## 用 man 命令查看 ls 命令的帮助文档
help  ls	## 用 help 命令查看 ls 命令的帮助文档	
ls  --help	## 用 --help 参数查看 ls 命令的帮助文档
```

### 常用快捷键

```
Tab:    补全
Ctrl+U: 剪切光标位置到行首的字符
Ctrl+C: 终止任务
Ctrl+Z: 暂停任务
Ctrl+L: 清屏
Ctrl+E: 回到行尾
Ctrl+A: 回到行首
```

### 组合技一：查看目录和文件

```
cd     进入目录
pwd    显示当前所在位置
ls     查看当前目录下文件
tree -L 1  将当前目录下文件以树形展示
```

**补充：**

常用符号

```
.  表示此层目录
.. 表示上一层目录
-  表示前一个工作目录
~  表示当前用户身份所在（家）
```

ls相关参数

```
ls -F     给每个目录后加上/，在可执行文件后加*，在链接文件后加上@。
ls -a     显示隐藏文件
ls -l     显示文件各种属性（权限）
ls -h     目录容量转换为GB\KB单位
ls -S     以文件大小排序
ls -t     以时间排序
```

### 组合技二：操作目录和文件

```
#创建目录（文件夹）
mkdir test1 test2         新建目录
mkdir -p /test3/test4     新建嵌套目录
#创建文件
touch file                
#移动（or重命名）
mv test5 test/            将test5移动到test目录下
#删除
rm -i             交互式删除
rm -f             删除且不警告
rm -r             删除整个目录
#rm –rf /*        删库
#复制
cp -i            交互式移动
cp -b            给原存在文件名后面加上[~]
cp -r            子目录连同文件一起复制
#创建链接
ln -s     创建软链接(依附)
ln        创建硬链接（独立）
```

**注意**：`mv`、`cp`等命令使用时若存在同名文件会替换掉之前的，即之前的被删掉，并且不会给出警告。可以通过使用`mv -i`来显示提醒；或`mv -b` 给原先存在的文件名后面加上[~]，从而避免这个文件被覆盖。

### 组合技三：压缩文件

-x ： 从已有tar归档文件中提取文件（解压缩）
-c ： 创建一个新的tar归档文件（创建压缩文件）
-f ： 输出结果到文件或设备
-v ： 在处理文件时显示文件（显示处理进度）
-z ： 将输出重定向给gzip命令

**解压**

```
tar  -zxvf Data.tar.gz
```

**压缩**

```
tar  -zcvf Data.tar.gz    Data  …
```

### 组合技四：文本查看

```
cat -A 列出所有内容，包括特殊字符
cat -n 打印出所有行号，-b参数仅打印非空白行行号
cat > file 重定向
zcat 查看压缩文件
head example | head -n 6  显示前六行
tail -n 6 显示后六行
less -SN example.gtf #单行显示，显示行号
wc  统计文本
wc -l 统计行数 

```

注：less命令进入新的页面，通过上下左右键查看文本内容，Enter键向下移动一行，空格键翻页，**q键退出**

### 组合技五：文本编辑

```
##去重
Sort     排序
uniq     去除相邻的重复行
    uniq -c：统计每个字符串连续出现的行数
    sort -n：按照数值从小到大进行排序
    sort -V：字符串中含有数值时，按照数值从小到大排序
    sort -r：逆向排序
    sort -k：指定区域
    sort -t：指定分隔符,默认\t
##文本合并
cat test1 test2 > test3 竖向合并
paste -d '-' test1 test2：横向合并（通过连接符-横向合并test1和test2）
seq 20 | paste - -  按两列排列
tr     字符替换
    tr -d：删除指定字符
    tr -s：缩减连续重复字符
```

