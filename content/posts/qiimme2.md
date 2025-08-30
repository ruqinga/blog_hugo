---
title: 微生物组qimme2分析
date: 2022-05-03
categories:
  - 微生物组
comments: true
toc: true
tags:
  - 进度/4-已完成
---

# 导论

开始前，你需要了解QIIME 2的以下信息

必看：

- [QIIME 2 官方论坛](https://forum.qiime2.org/)（非常有用哦）

- 使用[该页面](https://view.qiime2.org/)查看 QIIME 2 的 qzv 后缀可视化文件

- QIIME 2 官方文档：
  【[中文参考](https://mp.weixin.qq.com/s?__biz=MzUzMjA4Njc1MA==&mid=2247487350&idx=1&sn=aa945aca002ce1ebf3bfcdc50aadf63b&scene=21#wechat_redirect)】| [【中文参考2】](https://microbiomecat.gitee.io/20201005/QIIME2-based-amplicon-analysis-tutorial(Basic)/)
  【英文原版】 https://docs.qiime2.org
  官方文档会隔几个月更新一次，每个版本的更新内容在官方论坛里可以找到。

- 推荐一看的参考教程（中文版）：
  单端数据：https://github.com/YongxinLiu/QIIME2ChineseManual

  双端数据：https://mp.weixin.qq.com/s/p2Snx0v8Fh_BOY-z2vVUCg
  
- QIIME 2 安装教程：https://docs.qiime2.org/2022.2/install/

qiime2安装

```sh
# 更新conda减少问题
conda update conda 
# 下载wget
conda install wget
# 下载安装qiime2需要的安装包的目录（.yml格式）
wget https://data.qiime2.org/distro/core/qiime2-2022.2-py38-linux-conda.yml #根据官网下载最新
# 创建conda环境并安装
conda env create -n qiime2-2022.2 --file qiime2-2022.2-py38-linux-conda.yml
# 激活环境
conda activate qiime2-2022.2
# 查看是否安装成功
qiime --help
```

# 1 前处理

1.拆分样品：为了降低成本，往往将多个样本混合后再一起测序，其中为了区别不同样本会在 DNA 分子中用实验方法嵌入一段人工合成的编码序列（barcode）。在拿到数据后首先需要将不同组的样品区分开。具体操作见其它中的[拆分样品](# 拆分样品)

2.质检与引物切除：送公司测序返还的数据一般都是拆分过并去除了引物的，可以自己再做一下质检，后续使用dada2分析时也会有碱基质量分布图，所以这步可以不做，自己质检（fastqc）的信息会比较全面。

3.数据导入：在QIIME2中进行分析，需要将数据转化为QIIME2对象（artifacts）。更多可参考：[QIIME 2 参数](https://zhuanlan.zhihu.com/p/406701848)

## 1）质检

```sh
# 公司的给的测序数据一般都是拆分过的，可将单端数据全部合并做质检，也可单独质检
# cat命令合并压缩过的文件会出错，合并之前需要先解压。
gunzip *.gz # 解压
# 第一种方法：合并后质检。
cat *R1* > R1.fastq #合并上游序列,并指定输出文件名为R1.fastq
cat *R2* > R2.fastq #合并下游序列,并指定输出文件名为R2.fastq
# 质检
mkdir qc #创建一个文件夹用于存放质检文件
fastqc -t 2 R1.fastq R2.fastq -o qc # -t --threads，一般有多少个样本用多少线程。-o 指定输出文件存放目录。

# 第二种方法：单独质检后将质检报告合并
mkdir qct #创建一个文件夹用于存放质检文件
fastqc *fastq -t 10 -o qct
pip install multiqc #安装multiqc
multiqc qct/*  # 合并报告

```

## 2）切除引物

质检结果中，最后一项Adapter Content正常情况是趋于0的直线，也就是说序列两端Adapter已经去除干净；如果有Adapter，需要先用cutadapt去接头

```sh
# 安装与升级cutadapt
pip install --user --upgrade cutadapt
# 将cutadapt添加$PATH环境变量（需管理员权限，没有也没关系，可以跳到下一步）
echo 'PATH="$HOME/.local/bin:$PATH"'>>/etc/profile
# 如无管理员权限，每次使用cutadapt时需指定路径
如：~/.local/bin/cutadapt --help # 如不指定路径则会使用$PATH中的默认版本，老版本不支持多进程
# 创建存放cut的序列的目录
mkdir cut_adapt
# 切除引物序列示例。
~/.local/bin/cutadapt -g forward_primer -e number forward.fastq -o file/R1.fastq -j 0 
# cutadapt参数：
  -j 0 表示调用所有CPU
  -o 指定输出文件目录、文件名。
  -g 5’端引物 
  -a 3’端引物 
  -e 引物匹配允许错误率,如0.1，0.15等
```

接下来就将数据导入qiime2进行分析。注意：DADA2和deblur都执行质量过滤、去噪和嵌合体去除，因此在运行它们之前不应该执行任何质量筛选

## 3）数据准备与导入

需要数据：

- 元数据（设计方案）
- 测序数据（fasta数据）

为了能批量处理测序数据，需要准备2个文件：

- `manifest file`：下机数据对应关系清单
- `sample metadata`：元数据，也称为实验设计

```sh
# 1.manifest file
vim manifest file

sample-id,absolute-filepath,direction
002,$PWD/002_R1.fastq,forward
002,$PWD/002_R2.fastq,reverse
017,$PWD/017_R1.fastq,forward
017,$PWD/017_R2.fastq,reverse
020,$PWD/020_R1.fastq,forward
020,$PWD/020_R2.fastq,reverse
060,$PWD/060_R1.fastq,forward
060,$PWD/060_R2.fastq,reverse
091,$PWD/091_R1.fastq,forward
091,$PWD/091_R2.fastq,reverse
#另外如果不是当前测序数据文件下操作，可将$PWD替换为绝对路径（和上面的写法相等）

# 2.sample metadata
# 其中q2:types那行可以不写，如果分类是以数字来表示的，如1,2,3,代表不同的分组则需要标注这列对应的q2：types为categorical（分类的），否则会默认为numeric（数字）而报错。
#SampleID   subject edu height  weight  env1    env4
#q2:types       categorical categorical categorical categorical categorical
091 subject-1   5   160 50  2   1
020 subject-1   5   160 70  1   3
017 subject-1   2   174 70  1   3
060 subject-2   2   160 70  1   1
002 subject-2   5   174 50  2   1
```

上面是展示，下面用代码实现

```sh
wd="/home/leixingyi/project/four_flavor"
# 双端
find ${wd}/qc -type f -name "*fq.gz" | while read dir; do 
    sample=$(echo "$dir" | awk -F/ '{print $(NF-1)}')
    path=$(realpath "$dir")
    if grep -q "^${sample}$" ${wd}/sra/sra.ids; then
        if [[ $dir =~ .*_1\.fq\.gz$ ]]; then
            echo -e "${sample},${path},forward"
        elif [[ $dir =~ .*_2\.fq\.gz$ ]]; then
            echo "${sample},${path},reverse"
        fi
    fi
done > ${wd}/qiime2/manifest_paired
vim manifest_paired
# 第一行加上 sample-id,absolute-filepath,direction

# 单端
find ${wd}/qc -type f -name "*fq.gz" | while read dir; do 
    sample=$(echo "$dir" | awk -F/ '{print $(NF-1)}')
    path=$(realpath "$dir")
    if grep -q "^${sample}$" ${wd}/sra/sra2.ids; then
        echo -e "${sample}\t${path}"
    fi
done > ${wd}/qiime2/manifest_single
vim manifest_single
# 第一行加上 sample-id	absolute-filepath
```



**数据导入**

QIIME2为了使分析流程标准化，分析过程可重复，制定了统一的分析过程文件格式`.qza`；qza文件类似于一个封闭的文件格式(本质上是个标准格式的压缩包)，里面包括原始数据、分析的过程和结果。

生成qiime需要的artifact文件(qiime文件格式，将原始数据格式标准化)

单端测序数据导入:

```sh
time qiime tools import \
  --type 'SampleData[SequencesWithQuality]' \
  --input-path manifest_single \
  --output-path single-end-demux.qza \
  --input-format SingleEndFastqManifestPhred33V2
#--input-path 参数指定了包含样本信息和文件路径的元数据文件路径，--output-path 参数指定输出文件的路径和名称。--input-format 参数指定输入文件的格式
```

双端测序数据导入:

```sh
# 2m20.330s
time qiime tools import \
  --type 'SampleData[PairedEndSequencesWithQuality]' \
  --input-path manifest \
  --output-path paired-end-demux.qza \
  --input-format PairedEndFastqManifestPhred33

# 可视化文件paired-end-demux.qza
qiime demux summarize \
  --i-data paired-end-demux.qza \
  --o-visualization paired-end-demux.qzv

```

> `time`统计计算时间。
>
> `type`：输入数据类型，主要有
>
> - *FeatureData[PairedEndSequence]:* 特征数据[双端序列]，双端序列进行聚类或去噪后，生成的OTU/Feature。
> - *EMPPairedEndSequences:* 采用地球微生物组计划标准实验方法产生的双端测序数据。
>
> 输出对象: 
>
> - `emp-single-end-sequences.qza`
>
> - `paired-end-demux.qzv`：可视化文件
>
>   - 各样品测序数据柱状分布图，展示不同测序深度下样品数量分布
>   - **上下游碱基质量分布图**。根据这个确定质控参数，纵坐标低于20的值
>   - 生成的.qzv文件可[点这里](https://links.jianshu.com/go?to=https%3A%2F%2Fview.qiime2.org%2F)拖拽进网页查看(推荐)
>
>   - 或是使用`qiime tools view paired-end-demux.qzv` 查看



# 2 质控，合并双端序列

所谓质控，即去除不合格的reads，包括被接头序列污染的reads、含N碱基数≥3的reads、质量值<20的碱基、截切后长度＜60%原长的reads。经过质控后的reads成为clean reads，所有的分析都是在此基础上完成的。

QIIME 2插件多种质量控制并生成特征表的方式主要有两种，一种是通过去噪，即生成扩增/绝对序列变体（Absolute Sequence  Variants，ASV），ASV是最近发展的新一代方法，在功能上提供更好的分辨率。ASV可以基于400bp或更多序列中单个核苷酸的差异来分离特征，甚至超过99％同一性OTU聚类的分辨率。目前在QIIME 2  中可通过DADA2（q2-dada2）和Deblur（q2-deblur）插件实现。第二种是通过聚类生成操作分类单元（Operational  Taxonomic Units，OTU），这种方法自2010年以来便得到了广泛应用。QIIME  2目前可通过q2-vsearch插件实现。两种方法不推荐组合使用。本教程将着重介绍DADA2和Deblur两种方法。

*OTU(Operational Taxonomic Units)：*是通过一定距离计算两两不同序列之间的距离度量和相似性，设置特定的阈值，获得同一阈值下的距离矩阵，进行聚类操作，形成不同的分类单元。

QIIME 2插件多种质量控制方法可选，包括DADA2、Deblur和基于基本质量分数的过滤。

DADA2、Deblur这两种方法的结果将是一个QIIME 2对象`FeatureTable[Frequency]`和一个`FeatureData[Sequence]`，`Frequency`对象包含数据集中每个样本中每个唯一序列的计数（频率），`Sequence`对象将`FeatureTable`中的特征ID与序列对应。

嵌合体
![[3437768-78cb33c4c187aff9.webp]]

## 方法1. DADA2

DADA2是用于检测和校正（如果有可能的话）Illumina扩增序列数据的工作流程。正如在`q2-dada2`插件中实现的，这个质量控制过程将过滤掉在测序数据中识别的任何`phiX`序列（通常存在于标记基因Illumina测序数据中，用于提高扩增子测序质量），并同时过滤嵌合序列。

注意：需要20bp以上的overlap才能使用dada2拼接，否则会报错。

> 根据上面得到的`demux.qzv`**上下游碱基质量分布图**的结果进行参数设置
>
> 参数设置:
>
> - `–p-trim-left` 截取左端低质量序列，我们看上图中箱线图，左端质量都很高，无低质量区，设置为0
> - `–p-trunc-len `序列截取长度，也是为了去除右端低质量序列，我们看到大于120以后，质量下降极大，甚至中位数都下降至20以下，需要全部去除，综合考虑决定设置为120。
> - `f`=forward,`r`=reverse

单端数据处理

```sh
qiime dada2 denoise-single \
  --i-demultiplexed-seqs demux.qza \
  --p-trim-left 0 \
  --p-trunc-len 120 \
  --o-representative-sequences rep-seqs-dada2.qza \
  --o-table table-dada2.qza \
  --o-denoising-stats stats-dada2.qza
```

双端数据处理

数据输入：

- `paired-end-demux.qza`导入到QIIME2的测序数据

```sh
# 6m28.990s
time qiime dada2 denoise-paired \
  --i-demultiplexed-seqs paired-end-demux.qza \
  --p-trim-left-f 0 \
  --p-trim-left-r 0 \
  --p-trunc-len-f 270 \
  --p-trunc-len-r 250 \
  --o-table table-dada2.qza \
  --o-representative-sequences rep-seqs-dada2.qza \
  --o-denoising-stats stats-dada2.qza \
  --p-n-threads 0 #调用所有CPU
```

> 生成的三个输出文件：
>
> - stats-dada2.qza: dada2计算统计结果。
> - table-dada2.qza: 特征表
> - rep-seqs-dada2.qza: 代表序列

生成可视化qzv文件

```sh
# 对特征表统计进行可视化
qiime metadata tabulate \
  --m-input-file stats-dada2.qza \
  --o-visualization stats-dada2.qzv
# 我们的下游分析，将继续使用dada2的结果，需要将它们改名方便继续分析
mv rep-seqs-dada2.qza rep-seqs.qza
mv table-dada2.qza table.qza
```

输出可视化结果：`stats-dada2.qzv`：特征表统计结果

> id、输入、过滤、去噪和非嵌合
>
> | sample-id | input | filtered | denoised | non-chimeric |
> | --------- | ----- | -------- | -------- | ------------ |
> | L6S93     | 11270 | 7483     | 7483     | 7025         |
> | L6S68     | 9554  | 6169     | 6169     | 6022         |

## 方法2. Deblur

Deblur使用序列错误配置文件将错误的序列与从其来源的真实生物序列相关联，从而得到高质量的序列变异数据，主要为两个步骤。首先，应用基于质量分数的初始质量过滤过程，是Bokulich等人2013年发表的质量过滤方法。

### ① 数据质控

```sh
qiime quality-filter q-score \
 --i-demux demux.qza \
 --o-filtered-sequences demux-filtered.qza \
 --o-filter-stats demux-filter-stats.qza
```

>输出对象:
>
>- `demux-filtered.qza`: 序列质量过滤后结果。
>- `demux-filter-stats.qza`: 序列质量过滤后结果统计。

###  ② 去噪

设置截取长度`p-trim-length`：质量分数中位数开始下降至低质量区时的长度

```sh
time qiime deblur denoise-16S \
  --i-demultiplexed-seqs demux-filtered.qza \
  --p-trim-length 120 \
  --o-representative-sequences rep-seqs-deblur.qza \
  --o-table table-deblur.qza \
  --p-sample-stats \
  --o-stats deblur-stats.qza
```

> 输出结果:
>
> - deblur-stats.qza: 过程统计
> - table-deblur.qza: 特征表
> - rep-seqs-deblur.qza: 代表序列

### ③ 可视化

```sh
# 过滤结果可视化
qiime metadata tabulate \
  --m-input-file demux-filter-stats.qza \
  --o-visualization demux-filter-stats.qzv
# 去噪结果可视化
qiime deblur visualize-stats \
  --i-deblur-stats deblur-stats.qza \
  --o-visualization deblur-stats.qzv
```

> 输出结果:
>
> 1.`demux-filter-stats.qzv`: 质量过程统计表，同上面统计表类似
>
> 包括6列，第一列为样本名称，2-6列分别为总输入读长、总保留高读长、截断的读长、截断后太短的读长和超过最大模糊碱基的读长的数量统计。我们通常只关注2，3列数量即可，其它列常用于异常的输助判断。
>
> | sample-id | total-input-reads | total-retained-reads | reads-truncated | reads-too-short-after-truncation | reads-exceeding-maximum-ambiguous-bases |
> | --------- | ----------------- | -------------------- | --------------- | -------------------------------- | --------------------------------------- |
> | # q2:types | numeric           | numeric              | numeric         | numeric                          | numeric                                 |
> | L1S105    | 11340             | 9232                 | 10782           | 2066                             | 42                                      |
> | L1S140    | 9738              | 8585                 | 9459            | 1113                             | 40                                      |
> | L1S208    | 11337             | 10149                | 10668           | 1161                             | 27                                      |
>
> 2.`deblur-stats.qzv: deblur`分析统计表，有分析中每个步骤的统计表
>
> ![image-20220415190444858](C:\Users\22079\AppData\Roaming\Typora\typora-user-images\image-20220415190444858.png)

如果你想用此处结果下游分析，可以改名为下游分析的起始名称：

```sh
mv rep-seqs-deblur.qza rep-seqs.qza
mv table-deblur.qza table.qza
```

## 特征表和特征序列汇总

将上面dada2等质控方法得到的结果汇总，用于进一步分析

**创建数据可视化摘要**

1. 特性表汇总命令（`feature-table summarize`）

   提供关于与每个样品和每个特性相关联的序列数量、这些分布的直方图以及一些相关的汇总统计数据的信息

2. 特征表序列表格`feature-table tabulate-seqs`命令

   提供特征ID到序列的映射，并提供链接以针对NCBI nt数据库轻松BLAST每个序列。

```sh
# Feature表
qiime feature-table summarize \
  --i-table table.qza \
  --o-visualization table.qzv \
  --m-sample-metadata-file sample-metadata.txt
# 代表序列统计
qiime feature-table tabulate-seqs \
  --i-data rep-seqs.qza \
  --o-visualization rep-seqs.qzv
```

> 输出结果:
>
> - table.qzv: **特征表统计**。计算多样性时会用到
> - rep-seqs.qzv: **代表序列统计**，可点击序列跳转NCBI blast查看相近序列的信息。物种注释时会用到。

# 3 构建进化树用于多样性分析

QIIME2生成系统发育树，使用`q2-phylogeny`插件中的`align-to-tree-mafft-fasttree`工作流程：

- 首先，使用`mafft`程序执行对每个样本的特征计数`FeatureData[Sequence]`中的序列进行多序列比对，以创建QIIME 2对象`FeatureData[AlignedSequence]`。
- 接下来，屏蔽（mask或过滤）对齐的的高度可变区(高变区)，这些位置通常被认为会增加系统发育树的噪声。
- 随后，应用`FastTree`基于过滤后的比对结果生成系统发育树。FastTree程序创建的是一个无根树，因此在本节的最后一步中，应用根中点法将树的根放置在无根树中最长端到端距离的中点，从而形成有根树。

输入数据：

- `rep-seqs.qza`：代表序列

```sh
qiime phylogeny align-to-tree-mafft-fasttree \
  --i-sequences rep-seqs.qza \
  --o-alignment aligned-rep-seqs.qza \
  --o-masked-alignment masked-aligned-rep-seqs.qza \
  --o-tree unrooted-tree.qza \
  --o-rooted-tree rooted-tree.qza
# 导出进化树
qiime tools export \
  --input-path unrooted-tree.qza \
  --output-path exported-tree 
```

> 输出结果文件:
>
> - aligned-rep-seqs.qza: 多序列比对结果
> - masked-aligned-rep-seqs.qza: 过滤去除高变区后的多序列比对结果
> - rooted-tree.qza: 有根树，用于多样性分析
> - unrooted-tree.qza: 无根树
> -  exported-tree/tree.nwk :标准树nwk文件。

此外，由工作流程我们可以知道，上面的步骤可以分多步生成输出文件：

```sh
qiime alignment mafft --i-sequences rep-seqs.qza --o-alignment aligned-rep-seqs.qza 

qiime alignment mask --i-alignment aligned-rep-seqs.qza --o-masked-alignment masked-aligned-rep-seqs.qza 

qiime phylogeny fasttree --i-alignment masked-aligned-rep-seqs.qza --o-tree unrooted-tree.qza 

qiime phylogeny midpoint-root --i-tree unrooted-tree.qza --o-rooted-tree rooted-tree.qza 
```

# 4 Alpha和beta多样性分析

QIIME 2的多样性分析使用`q2-diversity`插件，该插件支持计算α和β多样性指数、并应用相关的统计检验以及生成交互式可视化图表。我们将首先应用`core-metrics-phylogenetic`方法，该方法将`FeatureTable[Frequency]`(特征表[频率])抽平到用户指定的测序深度，然后计算几种常用的α和β多样性指数，并使用`Emperor`为每个β多样性指数生成主坐标分析（PCoA）图。默认情况下计算的方法有：

**划重点：理解下面4种alpha和beta多样性指数的所代表的生物学意义至关重要。**

- α多样性

- - 香农(Shannon’s)多样性指数（群落丰富度的定量度量，即包括丰富度`richness`和均匀度`evenness`两个层面）
  - 可观测的OTU(Observed OTUs，群落丰富度的定性度量，只包括丰富度）
  - Faith’s系统发育多样性（包含特征之间的系统发育关系的群落丰富度的定性度量）
  - 均匀度Evenness（或 Pielou’s均匀度；群落均匀度的度量）

- β多样性

- - Jaccard距离（群落差异的定性度量，即只考虑种类，不考虑丰度）
  - Bray-Curtis距离（群落差异的定量度量，较常用）
  - 非加权UniFrac距离（包含特征之间的系统发育关系的群落差异定性度量）
  - 加权UniFrac距离（包含特征之间的系统发育关系的群落差异定量度量）

## 1）核心多样性

输入数据：

- `rooted-tree.qza`：有根树
- `table.qza`：特征表

参数设置：

- `--p-sampling-depth`：测序深度设置

> 依据 **table.qzv（特征表统计）**，如果数据量都很大，选最小的即可。如果有个别数据量非常小，去除最小值再选最小值

```sh
time qiime diversity core-metrics-phylogenetic \
  --i-phylogeny rooted-tree.qza \
  --i-table table.qza \
  --p-sampling-depth 1103 \
  --m-metadata-file sample-metadata.tsv \
  --output-dir core-metrics-results
```

> 输出对象(13个数据文件):
>
> -  Alpha多样性考虑进化的faith指数：core-metrics-results/faith_pd_vector.qza
> - Beta多样性unweighted_unifrac距离矩阵，不考虑丰度：core-metrics-results/unweighted_unifrac_distance_matrix.qza
> - Beta多样性基于Bray-Curtis距离PCoA的结果：core-metrics-results/bray_curtis_pcoa_results.qza
> - Alpha多样性香农指数：core-metrics-results/shannon_vector.qza。
> - 等量重采样后的特征表：core-metrics-results/rarefied_table.qza
> -  Beta多样性weighted_unifrac距离矩阵，考虑丰度：core-metrics-results/weighted_unifrac_distance_matrix.qza: 
> -  Beta多样性jaccard距离PCoA结果：core-metrics-results/jaccard_pcoa_results.qza
> - Alpha多样性observed otus指数：core-metrics-results/observed_otus_vector.qza
> -  Beta多样性基于有权重的unifrac距离的PCoA结果：core-metrics-results/weighted_unifrac_pcoa_results.qza:
> - Beta多样性jaccard距离矩阵：core-metrics-results/jaccard_distance_matrix.qza:
> - Alpha多样性均匀度指数：core-metrics-results/evenness_vector.qza
> - Beta多样性Bray-Curtis距离矩阵：core-metrics-results/bray_curtis_distance_matrix.qza: 
> - Beta多样性无权重的unifrac距离的PCoA结果：core-metrics-results/unweighted_unifrac_pcoa_results.qza:
>
> **输出对象(4种可视化结果)**:
>
> - core-metrics-results/unweighted_unifrac_emperor.qzv：无权重的unifrac距离PCoA结果采用emperor可视化。
> - core-metrics-results/jaccard_emperor.qzv：jaccard距离PCoA结果采用emperor可视化。
> - core-metrics-results/bray_curtis_emperor.qzv：Bray-Curtis距离PCoA结果采用emperor可视化。
> - core-metrics-results/weighted_unifrac_emperor.qzv：有权重的unifrac距离PCoA结果采用emperor可视化。

## 2）Alpha多样性组间显著性分析和可视化

在计算多样性度量之后，我们可以开始在样本元数据的分组信息或属性值背景下探索样本的微生物组成差异。此信息存在于先前下载的示例元数据文件中。

输入数据：

- 多样性值
- sample-medata

```sh
# 分组与faith_pd指数关系
qiime diversity alpha-group-significance \
  --i-alpha-diversity core-metrics-results/faith_pd_vector.qza \
  --m-metadata-file sample-metadata.tsv \
  --o-visualization core-metrics-results/faith-pd-group-significance.qzv
# 分组与Evenness均匀度关系
qiime diversity alpha-group-significance \
  --i-alpha-diversity core-metrics-results/evenness_vector.qza \
  --m-metadata-file sample-metadata.tsv \
  --o-visualization core-metrics-results/evenness-group-significance.qzv
```

> 输出可视化结果：
>
> - core-metrics-results/faith-pd-group-significance.qzv。
> - core-metrics-results/evenness-group-significance.qzv。
> - 图中可点Category选择分类方法，查看不同分组下箱线图间的分布与差别。图形下面的表格，详细详述组间比较的显著性和假阳性率统计。

## 3）Beta多样性分析

> 使用PERMANOVA方法（首先在Anderson 2001年的文章中描述）`beta-group-significance`分析分类元数据背景下的样本组合。以下命令将测试一组样本之间的距离，是否比来自其他组(例如，舌头、左手掌和右手掌)的样本彼此更相似，例如来自同一身体部位(例如肠)的样本。
>
> `--p-pairwise`参数，它将执行**成对检验**，结果将允许我们确定哪对特定组（例如，舌头和肠）彼此不同是否显著不同。这个命令运行起来可能很慢，尤其是当使用`--p-pairwise`参数，因为它是基于**置换检验**的。因此，我们将在元数据的特定列上运行该命令，而不是在其适用的所有元数据列上运行该命令。这里，我们将使用两个示例元数据列将此应用到未加权的UniFrac距离，如下所示。

```sh
# 按subject分组，统计unweighted_unifrace距离的组间是否有显著差异,其他的分组分析类似。
qiime diversity beta-group-significance \
  --i-distance-matrix core-metrics-results/unweighted_unifrac_distance_matrix.qza \
  --m-metadata-file sample-metadata.txt \
  --m-metadata-column subject \
  --o-visualization core-metrics-results/unweighted-unifrac-subject-significance.qzv \
  --p-pairwise
# 可视化三维展示unweighted-unifrac的主坐标轴分析
qiime emperor plot \
  --i-pcoa core-metrics-results/unweighted_unifrac_pcoa_results.qza \
  --m-metadata-file sample-metadata.txt \
  --p-custom-axes weight \
  --o-visualization core-metrics-results/unweighted-unifrac-emperor-weight.qzv
# 可视化三维展示bray-curtis的主坐标轴分析
qiime emperor plot \
  --i-pcoa core-metrics-results/unweighted_unifrac_pcoa_results.qza \
  --m-metadata-file sample-metadata.txt \
  --p-custom-axes height \
  --o-visualization core-metrics-results/unweighted-unifrac-emperor-height.qzv
```

## 4）Alpha稀释曲线

**Alpha rarefaction plotting**

用途：检测测序量是否充足

原理：使用qiime diversity alpha-rarefaction可视化器来探索α多样性与采样深度的关系。该可视化器在多个采样深度处计算一个或多个α多样性指数，范围介于1（可选地--p-min-depth控制）和作为--p-max-depth提供值之间。在每个采样深度，将生成10个抽样表，并对表中的所有样本计算alpha多样性指数计算。

> 参数：
>
> - `--p-max-depth`: 采样深度最大值
>
> - `--p-iterations`: 迭代次数（在每个采样深度计算的稀疏表）
>- `--m-metadata-file`: 样本元数据参数，可以基于元数据对样本进行分组。

```sh
qiime diversity alpha-rarefaction \
  --i-table table.qza \
  --i-phylogeny rooted-tree.qza \
  --p-max-depth 4000 \
  --m-metadata-file sample-metadata.tsv \
  --o-visualization alpha-rarefaction.qzv
```

> 可视化将有两个图。顶部图是α稀疏图，主要用于确定样品的丰富度是否已被完全观察或测序。如果图中的线在沿x轴的某个采样深度处看起来“平坦化”（即接近零斜率），则表明收集超出该采样深度的其他序列将不可能会有其他的OTU（feature）产生。如果图中的线条没有达到平衡，这可能是因为尚未完全观察到样品的丰富程度（因为收集的序列太少），或者它可能表明在数据中存在大量的测序错误（被误认为是新的多样性）。底部图表示当特征表稀疏到每个采样深度时每个组中保留的样本数。
>
> 5个样本被分成两组weight,图中显示即两条线，每组的样本数分别为2和3。

# 5 物种组成分析

为FeatureData[Sequence]的序列进行物种注释。我们将使用经过Naive Bayes分类器预训练的，并由q2-feature-classifier插件来完成这项工作。这个分类器是在Greengenes 13_8 99% OTU上训练的，其中序列被修剪到仅包括来自16S区域的250个碱基，该16S区域在该分析中采用V4区域的515F/806R引物扩增并测序。我们将把这个分类器应用到序列中，并且可以生成从序列到物种注释结果关联的可视化。

> 注意：物种分类器根据你特定的样品制备和测序参数进行训练时表现最好，包括用于扩增的引物和测序序列的长度。因此，一般来说，你应该按照使用q2-feature-classifier的训练特征分类器的说明来训练自己的物种分类器。我们在数据资源页面上提供了一些通用的分类器，包括基于Silva的16S分类器，不过将来我们可能会停止提供这些分类器，而让用户训练他们自己的分类器，这将与他们的序列数据最相关。

## 1）物种注释分类器

> - 可以下载已存在的分类器，[这里](https://docs.qiime2.org/2022.2/data-resources/)有Silva和Greengenes的全长和V4区的分类器供下载直接使用。
>
> - 也可以自己训练，下面介绍的是自己训练方法
>
>   训练原因：不同实验的扩增区域不同，鉴定物种分类的精度不同，提前的训练可以让分类结果更准确。但目前ITS区域训练对结果准确性提高不大，可以不用训练。
>
> - 数据来源：

输入数据：

- 代表序列:`rep-seqs.qza`

- 数据库文件:https://docs.qiime2.org/2022.2/data-resources/

  > 16S可选 Silva 132/128/123，RDP trainset 16/14, Greengene 13.8；真菌ITS选择UNITE

### ① 将数据导入到QIIME2对象

```sh
# 创建工作目录
mkdir -p training-feature-classifiers
cd training-feature-classifiers

# 下载数据库文件(greengenes)
wget ftp://greengenes.microbio.me/greengenes_release/gg_13_5/gg_13_8_otus.tar.gz
# 解压
tar -zxvf gg_13_8_otus.tar.gz
# 使用rep_set文件中的99_otus.fasta数据和taxonomy中的99_OTU_taxonomy.txt数据，也可根据需要选择其他相似度。

# 导入参考序列
qiime tools import \
  --type 'FeatureData[Sequence]' \
  --input-path 99_otus.fasta \
  --output-path ref-seq-bacteria.qza

# 导入物种分类信息
qiime tools import \
  --type 'FeatureData[Taxonomy]' \
  --input-format HeaderlessTSVTaxonomyFormat \
  --input-path 99_otu_taxonomy.txt \
  --output-path ref-taxonomy-bacteria.qza
```

> `  --input-format HeaderlessTSVTaxonomyFormat `\#Greengenes序列物种注释文件为tsv格式
>
> 输出对象：
>
> - `99_otus.qza`: 按99%聚类的参考数据库
> - `rep-seqs.qza`: 预训练的参考数据库。
> - `ref-taxonomy.qza`: 按99%聚类的参考数据库

### ② 获取仅保留细菌的分类信息（可选）

可省略。由于部分数据库中同时含有细菌和古菌，有时还含有真核生物的特征序列和分类信息，在比对过程中可能会导致菌属比对错误等情况的出现，所以提取单一菌属序列及分类信息有助于提高比对的准确度。此步骤可以视测序数据实际情况而定，在处理真菌ITS数据时，不需要提取单一菌属。

```sh
# 仅保留细菌的代表序列命令： 
qiime taxa filter-seqs 
--i-sequences ref-seqs.qza 
--i-taxonomy 99_otu_taxonomy.qza 
--p-include Bacteria 
--o-filtered-sequences ref-seqs-bacteria.qza
# 仅保留细菌的注释信息命令：
qiime rescript filter-taxa 
--i-taxonomy 99_otu_taxonomy.qza 
--m-ids-to-keep-file ref-seqs-bacteria.qza 
--o-filtered-taxonomy ref-taxonomy-bacteria.qza
```

### ③ 提取扩增区序列

2012年Werner等人研究表明，当一个朴素贝叶斯(Naive Bayes)分类器只训练被测序的目标序列的区域时，16S rRNA基因序列的分类准确度会提高。

参数：

- `p-f-primer`：正向引物
- `p-r-primer`：反向引物
- `p-trunc-len`：碱基数
- `min-length`和`max-length`：排除使用这些引物远远超出预期长度分布的模拟扩增结果

> 注意：如果你的引物序列长度大于30nt，它们很可能包含一些非生物序列：例如接头、连接物或条形码序列

```sh
# 按我们测序的引物来提取参考序列中的一段
time qiime feature-classifier extract-reads \
  --i-sequences ref-seqs-Bacteria.qza \
  --p-f-primer CCTACGGGNGGCWGCAG \      #341F引物
  --p-r-primer GACTACHVGGGTATCTAATCC \  #805R引物
  --p-trunc-len 120 \
  --p-min-length 100 \
  --p-max-length 400 \
  --o-reads ref-seqs.qza #提取的扩增区域
  
# 纯净版
time qiime feature-classifier extract-reads \
  --i-sequences ref-seq-bacteria.qza\
  --p-f-primer CCTACGGGNGGCWGCAG \
  --p-r-primer GACTACHVGGGTATCTAATCC \
  --o-reads ref-seqs.qza
```

### ④ 训练分类集

```sh
# 基于筛选的指定区段，生成实验特异的分类集，6m44.452s
time qiime feature-classifier fit-classifier-naive-bayes \
  --i-reference-reads ref-seqs.qza \
  --i-reference-taxonomy  ref-taxonomy-bacteria.qza \
  --o-classifier classifier-bacteria.qza
```

> **输出对象**：
>
> - `classifier.qza`:  分类器的训练结果。

### 分类真菌ITS序列

在Unite参考数据库上训练的Fungal  ITS分类器不会从提取/修剪引物扩增区域的方法中改善结果。建议在完整参考序列上训练Unite分类器。

> 推荐使用“developer”版本序列，因为标准版序列的已经被修剪到指定区域（不包括可能存在于标准引物产生的扩增子中的侧翼rRNA基因的部分）。
>
> - qiime_ver8_dynamic ：98%

```sh
# unite数据库下载：https://plutof.ut.ee/#/doi/10.15156/BIO/1264708
tar -zxvf sh_qiime_release_10.05.2021.tgz

# 参考序列导入
qiime tools import \
  --type 'FeatureData[Sequence]' \
  --input-path sh_refs_qiime_ver8_99_10.05.2021_dev.fasta \
  --output-path ref-seq-fungi.qza
# 注释信息导入
qiime tools import \
  --type 'FeatureData[Taxonomy]' \
  --input-format HeaderlessTSVTaxonomyFormat \
  --input-path sh_taxonomy_qiime_ver8_99_10.05.2021_dev.txt \
  --output-path ref-taxonomy-fungi.qza
# 以完整序列生成分类集 10m54.063s
time qiime feature-classifier fit-classifier-naive-bayes \
  --i-reference-reads ref-seq-fungi.qza \
  --i-reference-taxonomy ref-taxonomy-fungi.qza \
  --o-classifier classifier-fungi.qza

```



## 2）物种注释和可视化

输入：
 classifier.qza：分类器
 rep-seqs.qza：代表序列

输出：
 taxonomy.qza: 物种注释结果
 classifier.qza: 分类器的训练结果

```sh
# 使用训练后的分类集对结果进行注释 0m43.783s
time qiime feature-classifier classify-sklearn \
  --i-classifier classifier-bacteria.qza \
  --i-reads rep-seqs.qza \
  --o-classification taxonomy.qza2 #物种注释结果
# 可视化注释的结果
qiime metadata tabulate \
  --m-input-file taxonomy.qza \
  --o-visualization taxonomy.qzv
# 交互式物种组成堆叠柱状图
qiime taxa barplot \
  --i-table table.qza \
  --i-taxonomy taxonomy.qza \
  --m-metadata-file sample-metadata.tsv \
  --o-visualization taxa-bar-plots.qzv
```

> 注释结果中*_uncultured(如g_uncultured)表示注释上了数据库中已经被报道的暂未纯培养的物种。分类学比对后根据置信度阈值筛选，会有某些分类谱系在某一分类级别分值较低，在统计时以Unidentified标记；Unclassified表示数据库中没有找到对应于该序列的分类信息。Unclassified Tags指没有获得注释信息。若无此类标记表示数据库中没有参考序列（如 k__Bacteria;  p__Proteobacteria表示在纲水平以下无物种信息）。

# 6 ANCOM组间差异丰度分析

**Differential abundance testing with ANCOM**

ANCOM(Analysis of composition of microbiomes)是一种比较微生物数据中物种在组间显著性差异的分析方法，结果和LEfSe类似。ANCOM可用于识别不同样本组中丰度差异的特征。与任何生物信息学方法一样，在使用ANCOM之前，你应该了解ANCOM的假设和局限性。我们建议在使用这种方法之前先回顾一下ANCOM的论文 https://www.ncbi.nlm.nih.gov/pubmed/26028277。

> 注意：差异丰度检验在微生物学分析中是一个热门的研究领域。有两个QIIME 2插件可用：`q2-gneiss`和`q2-composition`。本节使用`q2-composition`，但是如果你想了解更多，还有一个教程在另外的数据集上使用`q2-gneiss`，在后面有详细介绍。
>
> 将ANCOM的性能与t检验和零膨胀高斯方法(Zero Inflated Gaussian，ZIG)进行了比较，ZIG方法用于推断两个或多个种群的平均分类群丰度。**ANCOM在提高统计能力的同时，可将FDR控制在理想的水平**。而t检验和ZIG则会使得FDR膨胀，在某些情况下t检验的膨胀可高达68%，ZIG的膨胀可高达60%

ANCOM是在`q2-composition`插件中实现的。ANCOM假设很少（小于约25%）的特征在组之间改变。**如果你期望在组之间有更多的特性正在改变，那么就不应该使用ANCOM**，因为它更容易出错（I类/假阴性和II类/假阳性错误都有可能增加）。因为我们预期身体部位的许多特征都会发生变化，所以在本教程中，我们将过滤完整的特征表后只包含肠道样本。然后，我们将应用ANCOM来确定哪种（如果有的话）序列变体在我们两个受试者的肠道样本中丰度存在差异。

我们将首先创建一个只包含肠道样本的特征表。（要了解关于筛选的更多信息，请参阅数据筛选教程。）

```sh
qiime feature-table filter-samples \
  --i-table table.qza \
  --m-metadata-file sample-metadata.tsv \
  --p-where "[body-site]='gut'" \
  --o-filtered-table gut-table.qza
```

> 输出对象：
>
> - gut-table.qza：只包含肠道样本的特征表。

ANCOM基于每个样本的特征频率对`FeatureTable[Composition]`进行操作，但是不能容忍零。为了构建组成composition 对象，必须提供一个添加伪计数`add-pseudocount`（一种遗失值插补方法）的`FeatureTable[Frequency]`对象，这将产生`FeatureTable[Composition]`对象。

```sh
qiime composition add-pseudocount \
  --i-table gut-table.qza \
  --o-composition-table comp-gut-table.qza
```

> 输出结果:
>
> - comp-gut-table.qza: 组成型特征表，无零值。

接下来可用ANCON对两组的特征进行丰度差异的比较了。

```sh
time qiime composition ancom \
  --i-table comp-gut-table.qza \
  --m-metadata-file sample-metadata.tsv \
  --m-metadata-column subject \
  --o-visualization ancom-subject.qzv
```

> 输出结果:
>
> - `ancom-subject.qzv`: 按Subject分类比较结果。

我们也经常对在特定的分类学层次上执行差异丰度检验。为此，我们可以在感兴趣的分类级别上折叠`FeatureTable[Frequency]`中的特性，然后重新运行上述步骤。在本教程中，我们将特征表折叠到属级别（即Greengenes分类法的第6级）。

```sh
qiime taxa collapse \
  --i-table gut-table.qza \
  --i-taxonomy taxonomy.qza \
  --p-level 6 \
  --o-collapsed-table gut-table-l6.qza

qiime composition add-pseudocount \
  --i-table gut-table-l6.qza \
  --o-composition-table comp-gut-table-l6.qza

qiime composition ancom \
  --i-table comp-gut-table-l6.qza \
  --m-metadata-file sample-metadata.tsv \
  --m-metadata-column subject \
  --o-visualization l6-ancom-subject.qzv
```

> 输出对象:
>
> - gut-table-l6.qza: 按属水平折叠的特征表。
> - comp-gut-table-l6.qza: 属水平筛选肠样本的相对丰度组成表。
>
> 输出可视化结果:
>
> - l6-ancom-Subject.qzv: 属水平差异比较结果。

# 7 功能基因预测分析

使用PICRUSt软件通过比对16S测序数据获得的物种组成信息，推测样本中的功能基因组成，从而分析不同样本或分组之间在功能上的差异。

首先需要对生成的OTU-table进行标准化（不同的种属菌包含的16S拷贝数不相同）；然后，通过每个OTU对应的greengene id，即可获得OTU对应的KEGG和COG家族信息，从而计算该KEGG和COG的丰度并从KEGG数据库的信息中获得Pathway、EC信息、OTU丰度计算各功能类别的丰度。







# 8 其它

目前可能用不上，但以后可能用上的一些补充资料，或补充过程

## 拆分样品

为了将混合序列进行样本拆分，我们需要知道哪个条形码序列与每个样本相关联。此信息包含在样品元数据文件中。

```sh
# 单端序列拆分
qiime demux emp-single \
  --i-seqs emp-single-end-sequences.qza \
  --m-barcodes-file sample-metadata.tsv \
  --m-barcodes-column BarcodeSequence \
  --o-per-sample-sequences demux.qza \
  --o-error-correction-details demux-details.qza
# 结果统计(可视化)
time qiime demux summarize \
  --i-data demux.qza \
  --o-visualization demux.qzv
```

> `demux.qza`包含样本拆分后的序列。
>
> `demux-details.qza`包括Golay标签错误校正的详细
>
> `demux.qzv`为输出结果
>
> - 样本拆分结果统计结果——样本数据量可视化图表。主要分为三部分：上部为摘要；中部为样本不同数据量分布频率柱状图，可下载PDF，下部为每个样本的测序量。上方面板还可切换至交互式质量图`Interactive Qaulity Plot`
> - 交互式质量图`Interactive Qaulity Plot`查看页面。同样为三部分：上部为每个位置碱基的质量分布交互式箱线图，鼠标点击在方面(中部)文字和表格中显示鼠标所在位置碱基的详细信息；下部为拆分样本的长度摘要(一般无差别，略)。
> - 所有QIIME 2可视化对象（即，使用`--o-visualization`参数指定的文件）将生成一个`.qzv`文件。你可以使用`qiime tools view`查看这些文件。但这条命令的显示需要图形界面的支持

## 微生物组生物信息学评估 Microbiome bioinformatics benchmarking

许多微生物组生物信息的校准比较研究是使用“模拟群落”进行的。模拟群落是一种人工制作的微生物群，这些微生物的种类和丰度是已知的，比如：：[Bokulich et al., (2013)](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC3531572/)和[Caporaso et al.(2011)](http://www.pnas.org/content/108/Supplement_1/4516.full)。公共模拟群落可以从这个链接下载[mockrobiota](http://mockrobiota.caporasolab.us)，关于此模拟群落的信息在这篇文章中有详细介绍：[Bokulich et al., (2016)](http://msystems.asm.org/content/1/5/e00062-16)









# 参考

[QIIME 2 16S扩增子分析基础流程及常用命令（新手友好向）](https://blog.csdn.net/weixin_42126262/article/details/107285753)

[NAR：UNITE真菌鉴定ITS数据库——处理未分类和并行分类(数据库文章阅读模板)](https://blog.csdn.net/woodcorpse/article/details/88785361) 很帮助的阅读模板

[ITS注释分类器训练](https://blog.csdn.net/Lincoln_redwine/article/details/115661665)
