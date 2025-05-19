# Change Log

All notable changes to the "mdplant" extension will be documented in this file.

Check [Keep a Changelog](http://keepachangelog.com/) for recommendations on how to structure this file.

## [Unreleased]

## [2.1.3] - 2025-5-19

### Added
- 支持list转plantuml时序图if/else循环

### Changed
-

### Fixed
-


## [2.1.2] - 2025-5-13

### Added
- 支持list转plantuml时序图for/while循环

### Changed
-

### Fixed
-

## [2.1.1] - 2025-4-23

### Added
- 无

### Changed
- 支持list转plantuml时序图注释

### Fixed
- 无refers目录保存plantuml时添加.puml后缀

## [2.1.0] - 2025-4-17

### Added
- 无

### Changed
- 优化list转plantuml时序图

### Fixed
- 无


## [2.0.30] - 2025-2-15

### Added
- 无

### Changed
- 从git config获取文件创建者信息

### Fixed
- 无

## [2.0.29] - 2025-2-7

### Added
- 无

### Changed
- 无

### Fixed
- 修复author info表格无法渲然问题


## [2.0.28] - 2025-2-7

### Added
- 加入文档作者信息

### Changed
- 无

### Fixed
- 无



## [2.0.27] - 2024-10-20

### Added
- 无

### Changed
- 修改README.md

### Fixed
- 无


## [2.0.26] - 2024-10-18

### Added
- 在split模式下，专门添加两个终端，一个用于执行push文件，一个用于执行命令

### Changed
- 无

### Fixed
- 无

## [2.0.25] - 2024-9-7

### Added
- 无

### Changed
- 无

### Fixed
- 修复index功能无空行问题

## [2.0.24] - 2024-8-28

### Added
- 无

### Changed
- 优化plantuml功能描述
- 添加mindmap

### Fixed
- 无

## [2.0.23] - 2024-8-25

### Added
- 无

### Changed
- 调整sequence工具顺序

### Fixed
- 无


## [2.0.22] - 2024-8-24

### Added
- 支持sequence更多功能及完善

### Changed
- 无

### Fixed
- 修复http文件名导致的list功能异常


## [2.0.21] - 2024-7-20

### Added
- 无

### Changed
- 无

### Fixed
- menu多次执行导致行紊乱


## [2.0.20] - 2024-7-8

### Added
- 无

### Changed
- 无

### Fixed
- 替换文件路径反斜杠避免参数反斜杠被替换


## [2.0.19] - 2024-7-3

### Added
- 格式化文件索引时替换点号为下划线

### Changed
- 无

### Fixed
- 无


## [2.0.18] - 2024-6-24

### Added
- terminal命令支持相对路径shell文件执行

### Changed
- 无

### Fixed
- terminal相对路径处理保持缩进


## [2.0.17] - 2024-5-27

### Added
- terminal命令支持路径裁剪

### Changed
- 无

### Fixed
- 修复缩进导致相对路径失效


## [2.0.16] - 2024-5-14

### Added
- terminal命令支持相对路径补全

### Changed
- 无

### Fixed
- 无


## [2.0.15] - 2024-5-14

### Added
- 无

### Changed
- 无

### Fixed
- 优化`adb shell`前缀逻辑，避免和`adb shell`命令冲突

## [2.0.14] - 2024-5-14

### Added
- 无

### Changed
- 无

### Fixed
- 修复esc不选择导致的错误执行

## [2.0.13] - 2024-5-13

### Added
- 点击状态栏选项后通过快速选择选择命令前缀

### Changed
- 无

### Fixed
- 无

## [2.0.12] - 2024-5-12

### Added
- 支持快捷键将行内代码转为终端命令，支持`adb shell`添加前缀
- 状态栏提供`cmd prefix`查看当前命令前缀，目前只有`None`、`adb shell`两种

### Changed
- 无

### Fixed
- 无

## [2.0.11] - 2024-3-23

### Added
- 无

### Changed
- 保持trim缩进的字符，而不是替换为空格

### Fixed
- 检查结构体移除缩进检查，防止出现结构体套结构体导致trim功能失败

## [2.0.10] - 2024-3-20

### Added
- 支持plantuml文件使用class diagram

### Changed
- 无

### Fixed
- 无

## [2.0.9] - 2024-1-17

### Added
- 选择的文本转成粗体
- macOS也支持ctrl+enter快捷键

### Changed
- 无

### Fixed
- 无


## [2.0.8] - 2024-1-12

### Added
- 选择的文本转成一行HTML List，便于用于Markdown Table中，用`|`或者换行做间隔

### Changed
- 无

### Fixed
- 无

## [2.0.7] - 2023-12-31

### Added
- 修改结构体示例
- 添加class block获取函数，为后续处理class作准备
- 添加UI group将同类操作分组

### Changed
- 修正属性连接的struct名限制

### Fixed
- 无


## [2.0.6] - 2023-12-29

### Added
- 支持处理PlantUML Class trim/link功能

### Changed
- 移除PlantUML MindMap/Gantt图，感觉用途不大，有需要再开放

### Fixed
- 无


## [2.0.5] - 2023-12-27

### Added
- 支持处理PlantUML Class图

### Changed
- 无

### Fixed
- 无


## [2.0.4] - 2023-12-24

### Added
- 无

### Changed
- PlantUML Sequence同名文件调用函数不需要写两个文件

### Fixed
- 无


## [2.0.3] - 2023-12-13

### Added
- 无

### Changed
- 无

### Fixed
- 修复获取textblock越界


## [2.0.2] - 2023-12-11

### Added
- 支持PlantUML帮助链接

### Changed
- 无

### Fixed
- 无


## [2.0.1] - 2023-12-9

### Added
- 支持PlantUML MindMap

### Changed
- 无

### Fixed
- 无

## [2.0.0] - 2023-12-6

### Added
- 支持PlantUML Sequence
- 支持PlantUML Gantt

### Changed
- js自动获取button id，减少硬编码

### Fixed
- 无

## [1.2.7] - 2023-12-6

### Added
- 支持PlantUML文本转换功能

### Changed
- 无

### Fixed
- 修复PlantUML指令空白行不执行
- 修复PlantUML指令处理结束


## [1.2.6] - 2023-12-3

### Added
- 无

### Changed
- 无

### Fixed
- Windoes copy路径错误


## [1.2.5] - 2023-11-23

### Added
- 支持format index to

### Changed
- 优化format index处理方式

### Fixed
- 无

## [1.2.4] - 2023-11-20

### Added
- 无

### Changed
- 无

### Fixed
- clipboard路径检查优先级提高，防止与参考文档冲突

## [1.2.3] - 2023-11-19

### Added
- 支持从粘贴板路径直接生成文件、图片list

### Changed
- 无

### Fixed
- 无

## [1.2.2] - 2023-10-28

### Added
- 支持参考文档快捷生成
- 支持resort to指定的索引

### Changed
- 无

### Fixed
- 无


## [1.2.1] - 2023-10-26

### Added
- 无

### Changed
- 无

### Fixed
- 修复resort to导致resort附件索引错误问题


## [1.2.0] - 2023-10-14

### Added
- 支持检测代码段

### Changed
- 使用代码段处理plantuml图片
- format index支持对所有未格式化索引的文件自动格式为当前索引

### Fixed
- 无

## [1.1.23] - 2023-10-7

### Added
- 无

### Changed
- 无

### Fixed
- 贴图重名不覆盖处理

## [1.1.22] - 2023-10-7

### Added
- 无

### Changed
- 格式化索引支持重置索引

### Fixed
- 无

## [1.1.21] - 2023-10-3

### Added
- 无

### Changed
- html list for table

### Fixed
- 无

## [1.1.20] - 2023-9-30

### Added
- 无

### Changed
- 无

### Fixed
- format index with whitespace replace

## [1.1.19] - 2023-9-24

### Added
- 无

### Changed
- 无

### Fixed
- 修复copy文件名不能包含点号

## [1.1.18] - 2023-9-2

### Added
- 无

### Changed
- table excel/csv采用对齐

### Fixed
- table excel生成引用错误导致报错

## [1.1.17] - 2023-8-20

### Added
- support format index: auto generate index for refer file

### Changed
- 无

### Fixed
- 无


## [1.1.16] - 2023-7-31

### Added
- 无

### Changed
- 无

### Fixed
- indent support lang type
- sort/resort windows path compatible


## [1.1.15] - 2023-7-5

### Added
- 无

### Changed
- 无

### Fixed
- 修复conf.py不存在导致的无法创建project

## [1.1.14] - 2023-7-4

### Added
- 无

### Changed
- 无

### Fixed
- 修复sort/resort不重置索引问题
- 标题上下都要求有空行
- 修复menu直接替换导致的文本丢失

## [1.1.13] - 2023-6-30

### Added
- 添加标题数字索引

### Changed
- 无

### Fixed
- 无

## [1.1.12] - 2023-6-28

### Added
- 无

### Changed
- 移除merge文档链接

### Fixed
- 无

## [1.1.11] - 2023-6-27

### Added
- 无

### Changed
- 支持更新基础project模板
- 修改右键功能过滤

### Fixed
- 无

## [1.1.10] - 2023-6-27

### Added
- 支持将当前subproject转为更进一级subproject

### Changed
- 无

### Fixed
- 无

## [1.1.9] - 2023-6-24

### Added
- 无

### Changed
- 新建整个project失败给出提示，允许.git开头文件不提示
- 右键sort、resort过滤显示
- 优化merged处理
- 移除不需要的文档

### Fixed
- 无

## [1.1.8] - 2023-6-24

### Added
- 无

### Changed
- 支持合并文档

### Fixed
- 无

## [1.1.7] - 2023-6-20

### Added
- 无

### Changed
- 修正list过滤table正则表达式

### Fixed
- 无

## [1.1.6] - 2023-6-17

### Added
- 无

### Changed
- 更新模版内容，添加快捷键参考、练习模版

### Fixed
- 无

## [1.1.5] - 2023-6-13

### Added
- 支持resort功能

### Changed
- 无

### Fixed
- 无

## [1.1.4] - 2023-6-6

### Added
- 无

### Changed
- 默认创建文件改为创建子目录

### Fixed
- 无

## [1.1.3] - 2023-5-23

### Added
- 无

### Changed
- sort自动更新README.md

### Fixed
- 无

## [1.1.2] - 2023-5-20

### Added
- 支持sub project重排序

### Changed
- 将右键功能放在一个单独的group中

### Fixed
- 无

## [1.1.1] - 2023-5-7

### Added
- 无

### Changed
- 无

### Fixed
- 优化检测默认文档目录，docs优先
- 优化list检测，防止indent中错误检测到list

## [1.1.0] - 2023-5-3

### Added
- 无

### Changed
- 支持docs、src作为默认文档目录，docs优先
- 支持独立的右键group

### Fixed
- 无

## [1.0.17] - 2023-4-29

### Added
- 无

### Changed
- 添加icon

### Fixed
- 无

## [1.0.16] - 2023-4-28

### Added
- 无

### Changed
- copy命令可以支持覆盖文件: copy [source] [target]
- EXPLORER中右键`Create MDPlant Template`时自动检测创建文件还是子项目
- list路径支持绝对路径
- copy提供缺失文件提示

### Fixed
- 无

## [1.0.15] - 2023-3-23

### Added
- 无

### Changed
- 无

### Fixed
- 删除子项目不更新README中的table表

## [1.0.14] - 2023-3-18

### Added
- 无

### Changed
- 允许list命令文本中有-

### Fixed
- 无

## [1.0.13] - 2023-3-16

### Added
- 无

### Changed
- list提高http检查优先级
- 修复文件名存在类似数字索引导致拷贝不修改链接

### Fixed
- 无

## [1.0.12] - 2023-3-11

### Added
- 无

### Changed
- list支持.开头的文件
- 新建文件第二个一级标题改为参考文档

### Fixed
- 无

## [1.0.11] - 2023-2-25

### Added
- 无

### Changed
- 无

### Fixed
- 正则表达式匹配copy文件索引

## [1.0.10] - 2023-2-25

### Added
- 无

### Changed
- 无
- 无

### Fixed
- 固定为4个索引字符为文件索引，因为过少的字符匹配导致链接失效

## [1.0.9] - 2023-2-25

### Added
- 无

### Changed
- 优化copy功能，可以在任意文件执行拷贝文件到当前子项目，自动打开文件
- 优化子项目文档模版索引从0001为0000，便于copy功能从0001开始计算索引

### Fixed
- 无

## [1.0.8] - 2023-2-22

### Added
- 支持copy快捷命令，便于迁移文件及其附属文件

### Changed
- 无

### Fixed
- 无

## [1.0.7] - 2023-2-7

### Added
- 无

### Changed
- 无

### Fixed
- 修复ubuntu无xclip不提示

## [1.0.6] - 2023-2-3

### Added
- 支持src目录右键创建子project

### Changed
- 无

### Fixed
- 无

## [1.0.5] - 2022-12-10

### Added
- 无

### Changed
- 无

### Fixed
- menu多删除了下划线
- 快捷键与list冲突

## [1.0.4] - 2022-12-7

### Added
- 无

### Changed
- 无

### Fixed
- 修复list检查中文目录卡死引发的list判断错误


## [1.0.3] - 2022-12-6

### Added
- 无

### Changed
- 无

### Fixed
- 修复list检查中文目录卡死


## [1.0.2] - 2022-12-5

### Added
- 无

### Changed
- 无

### Fixed
- 修复list检查文件有符号卡死


## [1.0.1] - 2022-12-5

### Added
- 无

### Changed
- list转tree不限制代码块语言设置

### Fixed
- 无


## [1.0.0] - 2022-11-23

### Added
- 支持plantuml获取图片

### Changed
- 才用新的架构，分离出MDPlantLib作为核心处理逻辑

### Fixed
- 无


## [0.0.37] - 2022-10-14

### Added
- 无

### Changed
- 创建文件会替换下划线

### Fixed
- 删除文件夹、修改文件会更新README.md中的table


## [0.0.36] - 2022-10-1

### Added
- 无

### Changed
- 无

### Fixed
- Windows路径导致删除文件相对路径出错

## [0.0.35] - 2022-9-28

### Added
- 无

### Changed
- 无

### Fixed
- 空白行(空格、制表符缩进)允许粘贴图片
- 子项目右键创建另一个子项目，不用滚轮到src目录去处理
- 子项目内docs、docs/images、docs/refers目录右键创建文件
- 子项目内在`\d{1,4}_[^\\\/]*\.md`文件右键创建文件

## [0.0.34] - 2022-9-24

### Added
- 无

### Changed
- 无

### Fixed
- 创建子项目不限制在src、docs目录 
- 支持一级目录更新README.md

## [0.0.33] - 2022-9-17

### Added
- 支持删除子工程时自动更新README.md table表
- 支持快速生成table表模板

### Changed
- 无

### Fixed
- 支持对`## docs`的更新

## [0.0.32] - 2022-9-12

### Added
- 支持自动更新README.md table表

### Changed
- 无

### Fixed
- 无


## [0.0.31] - 2022-9-10

### Added
- 支持目录模版

### Changed
- 无

### Fixed
- 无

## [0.0.30] - 2022-8-8

### Added
- 支持文件名有空格

### Changed
- 无

### Fixed
- 无

## [0.0.29] - 2022-8-2

### Added
- 支持index命令，以list的形式列举指定文件夹下的正则表达式匹配的文件

### Changed
- 无

### Fixed
- 移除salt命令

## [0.0.28] - 2022-7-27

### Added
- 无

### Changed
- 无

### Fixed
- README.md文件为空的摘要为Empty Abstract

## [0.0.27] - 2022-7-21

### Added
- 无

### Changed
- 无

### Fixed
- 空行不检查处理list、indent等操作
- 获取摘要错误

## [0.0.26] - 2022-7-8

### Added
- 无

### Changed
- 无

### Fixed
- 修复indent中嵌套文件无法处理indent

## [0.0.25] - 2022-6-28

### Added
- 无

### Changed
- 无

### Fixed
- 修复list中嵌套代码段导致无法快捷处理list问题未考虑周全过滤

## [0.0.24] - 2022-6-26

### Added
- 无

### Changed
- 无

### Fixed
- 修复list中嵌套代码段导致无法快捷处理list问题

## [0.0.23] - 2022-5-29
### Added
- 无

### Changed
- change info log to console

### Fixed
- fix resolv indent error for table


## [0.0.22] - 2022-5-27
### Added
- 无

### Changed
- 无

### Fixed
- remove menu info at menu link
- resolv indent code at list


## [0.0.21] - 2022-5-18
### Added
- 无

### Changed
- 无

### Fixed
- since "#menu" and "## menu" for alt+enter(cmd + enter)


## [0.0.20] - 2022-5-3
### Added
- 无

### Changed
- 无

### Fixed
- http index for alt+enter(cmd + enter)
- since "## docs" for alt+enter(cmd + enter)

## [0.0.19] - 2022-3-11
### Added
- 无

### Changed
- 无

### Fixed
- chinese punctuation


## [0.0.18] - 2022-3-7
### Added
- 无

### Changed
- 无

### Fixed
- compatible Windows



## [0.0.17] - 2022-3-5
### Added
- auto generate image index when paste image

### Changed
- 无

### Fixed
- fix last line can't work for ctrl + enter when paste image


## [0.0.16] - 2022-2-11
### Added
- 无

### Changed
- 无

### Fixed
- fix last line can't work for ctrl + enter
- fix ctrl+ enter not work for directory

## [0.0.15] - 2022-1-7
### Added
- ctrl+enter will auto check menu/list/indent/table function

### Changed
- 无

### Fixed
- 无

## [0.0.14] - 2021-12-11
### Added
- ctrl+enter(cmd+enter) for save image from clipboard

### Changed
- 无

### Fixed
- 无

## [0.0.13] - 2021-11-19
### Added
- 无

### Changed
- more easy use for salt cmd
- keep line wihtespace for list cmd

### Fixed
- 无

## [0.0.12] - 2021-10-16
### Added
- support sub dir README.md

### Changed
- table use default dir "docs" when enter empty inputed

### Fixed
- 无


## [0.0.11] - 2021-09-30
### Added
- support indent, list to tree

### Changed
- 无

### Fixed
- 无

## [0.0.10] - 2021-09-22
### Added
- 无

### Changed
- 无

### Fixed
- support list revert
- support salt revert
- remove index, table is batter then index
- table with relative path for default generate and for absolute with '~' string start

## [0.0.7] - 2021-01-31
### Added
- 无

### Changed
- 无

### Fixed
- support gif
- table remove suffix `.md`



## [0.0.7] - 2020-04-2
### Added
- 无

### Changed
- 无

### Fixed
- 匹配GMF标题目录，主要是移除`、.()`标题中的这几个字符


## [0.0.6] - 2020-03-29
### Added
- menu命令，提取当前文档的标题，并形成菜单

### Changed
- 无

### Fixed
- 无

## [0.0.5] - 2020-03-28
### Added
- table命令，将index命令生成的索引换成生成table，并提取其摘要内容，摘要内容是标题一到标题二之间的第一行实体内容，如果没有，显示`Empty Abstract`

### Changed
- 无

### Fixed
- 无


## [0.0.4] - 2020-03-28
### Added
- 无

### Changed
- index命令，添加Settings的`MDPlant.mdindex.fileRegEx`字段匹配文件名，默认`^\d{1,4}_.*\.md`正则表达式匹配文件名

### Fixed
- 无

## [0.0.3] - 2020-03-27
### Added
- index命令，根据输入的相对目录（打开的项目根目录），根据`/^\d{1,4}_.*\.md/g`正则表达式匹配文件名，以Markdown list形式展现

### Changed
- 无

### Fixed
- 无