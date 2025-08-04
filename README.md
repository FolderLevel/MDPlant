# MDPlant

Markdown Tools

# 背景及目标

## 背景

我们很难做到一次就分析、思考完自己的目标，所以需要通过记录的方式保存当前的分析思路，Markdown文本是一个不错的记录方式选择，不过还是希望通过快捷健进行协助处理，通过软件识别格式进行文本转换，简化Markdown文档编写的流畅度，这样我们可以将更多的时间用于思考，减少文档格式的操作

* 编辑器需要跨平台，也就是要能在Windows/Linux/macOS运行，因为个人会涉及这三个平台
* 编辑器需要支持vim功能，因为个人常用到vim，不希望更改习惯
* 能够自己管控所有的文本、图片、参考文档
* 最终选择了VS Code，并基于该软件开发插件
* 目前的Markdown编辑器可以写文档，但不能解决个人文档管理需求
  * 文档先后排序
  * 文档摘要提取
  * 文档索引
  * 文档层级关系
  * 图片、参考文档的管理

## 目标

* 主目录尽可能精简，譬如只需要README.md和src目录(或者docs目录)，譬如在github上查看，可以第一时间看到README.md内容，不用鼠标下拉
* 可以通过鼠标右键直接创建带索文档或者子目录，文档索引可修改
* 文档、子文档目录以4位十进制数和`_`开始
* README.md会自动收集docs/src目录下的数据，形成列表
* docs文档平齐的目录下：
  * images用于存放图片，图片名以4位十进制数和`_`开始
  * refers用于存放参考文档，图片名以4位十进制数和`_`开始
* Markdown文本功能，不全部列举：
  * 支持文本、图片索引转换
  * 支持文档索引表格
  * 支持目录索引
  * 可以粘贴图片
  * 支持代码跟踪的层级关系转成tree的形式
  * 可以导入excel、csv、json成表格
  * 支持PlantUML文本转换成图片
  * 支持行代码命令终端执行

# 参考示例

* https://github.com/FolderLevel/RaspberryPi
  * 一级文档参考
* https://github.com/FolderLevel/MDPlant/tree/DocsExample
  * 多级文档参考

# 基本快捷功能

* Windows、Linux：Ctrl + Enter
* macOS:
  * CMD + Enter
  * Ctrl + Enter
* **如果快捷键不生效，请在VS Code快捷键映射中自行重定义按键映射**

## list

拷贝文件相对路径粘贴后按快捷键

src/0000_Template/docs/refers/0002_green_image.tar.bz2

src/0000_Template/docs/images/0002_green_image.png

## table

`table `字段后跟json、excel、csv文件相对路径，或者表格行列

table src/0000_Template/docs/refers/0000_BasicWebInfo.json

table src/0000_Template/docs/refers/0003_excel.xls

table src/0000_Template/docs/refers/0003_table.csv

table 5x5

table 5*5

table 5 5

## tree

主要用于分析代码流程

```
* title
  * program 1
    * text 1
  * program 2
    * text 2
    * program 3
      * text 3
      * program 4
        * text 4
    * program 5
      * text 5
  * program 6
    * text 6
```

## menu

menu标题，直接按快捷键出来



## docs

docs标题，直接按快捷键后输入`.`后按快捷键，`.`表示当前目录



## index

index标题，直接按快捷键后输入`.`后按快捷键，`.`表示当前目录



## paste

将图片复制到粘贴板，然后按快捷键，Ubuntu需要安装xclip



## copy

`copy `字段后跟相对路径或者绝对路径

copy src/0000_Template/docs/0002_green_image.md

# 版权

Copyright (c) 2020 ~ 2025 zengjf. All rights reserved.
