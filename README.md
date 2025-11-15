# gongdiguanli
项目概述：
这是一个基于Spring Boot和Vue的工地管理系统（Construction Management System, CMS），旨在实现建筑工地的数字化管理，提升施工效率、人员调度与资源协调能力。系统面向工人、项目经理和管理员三类用户，覆盖从登录认证到项目执行、任务分配、请假审批、后勤保障及数据监控的全流程管理。
需要项目可以添加小羊微信 微信：ShaunXiaoYangOvO 或关注小红书账号：95677443851
<img width="509" height="365" alt="image" src="https://github.com/user-attachments/assets/775371b4-9476-4bcf-b312-5282f00ff2bd" />
技术栈
后端技术栈
主框架: Spring Boot 2.5.4
持久层: MyBatis-Plus
安全框架: Apache Shiro 1.9.0
缓存: Redis
接口文档: Swagger2
构建工具: Maven
Java版本: Java 8
前端技术栈
主框架: Vue.js
构建工具: Vite
包管理: npm
UI: 原生CSS + Vue组件
数据库
类型: MySQL
初始化脚本: init.sql, equipment.sql, equipment_data.sql, t_department.sql
项目模块结构
项目采用前后端分离架构，分为两个主要模块：
后端模块(base-server)
核心业务功能
1. 用户认证与权限管理
多角色登录（工人、经理、管理员）
基于Shiro的安全框架实现权限控制
登录日志记录
2. 公告管理
按角色/部门发布和查看公告
公告精准推送
3. 项目管理
创建项目、分配工人
跟踪施工进度
4. 任务管理（含工作流）
经理分配任务，工人反馈进度
经理审核确认任务完成
工作流机制确保任务审批规范
5. 请假管理（含工作流）
工人提交请假申请
经理审批请假
自动影响考勤与排班
6. 后勤管理
住宿安排
设备领用
物资发放与归还
7. 数据统计与监控
可视化展示人员分布
项目进展跟踪
物资使用情况分析
项目亮点
1. 完整的业务闭环
系统涵盖了工地管理的主要业务场景，从前端用户界面到后端数据处理，形成了完整的业务闭环。
2. 工作流引擎应用
针对任务分配和请假申请这两个核心场景，实现了工作流机制，确保审批流程规范化。
3. 灵活的权限控制系统
基于Apache Shiro实现细粒度的权限控制，支持角色和部门级别的权限分配。
4. 统一的响应格式
所有API接口均使用统一的CommonResult封装，便于前端统一处理。
5. AOP切面编程应用
通过AOP实现日志记录、字段翻译等功能，减少重复代码，提高开发效率。
6. 丰富的工具类封装
提供了多种实用工具类，如图片压缩、PDF转图片等，方便扩展功能。
7. 易于扩展的设计
模块划分清晰，遵循标准的分层架构，便于后续功能扩展和维护。
总结
该工地管理系统具有完整的业务功能和技术架构，能够满足建筑工地日常管理的各项需求。其前后端分离的设计使得系统具备良好的可维护性和扩展性，同时引入的工作流机制和权限控制系统提升了系统的专业性和安全性。
<img width="1869" height="956" alt="微信图片_20251115113144_73_111" src="https://github.com/user-attachments/assets/cd719947-8bd5-4a23-9cc1-92a427b7a62d" />
<img width="1869" height="956" alt="微信图片_20251115113144_73_111" src="https://github.com/user-attachments/assets/d8eabbd6-98a7-4aac-8ab1-fc147c192bf0" />
<img width="1869" height="956" alt="微信图片_20251115113144_73_111" src="https://github.com/user-attachments/assets/91e183e0-4dae-4b51-8d9c-30b30ee9d7e4" />
<img width="1863" height="942" alt="微信图片_20251115113555_76_111" src="https://github.com/user-attachments/assets/71c98dc6-0eaa-4bc8-ba39-68b2f9a33c49" />
<img width="1863" height="942" alt="微信图片_20251115113555_76_111" src="https://github.com/user-attachments/assets/89191dd3-c11a-4e99-be74-55b08cc5d348" />
<img width="1863" height="942" alt="微信图片_20251115113555_76_111" src="https://github.com/user-attachments/assets/15c0d7fa-5c3d-4bc4-87a5-c12a7e9735c8" />
<img width="1863" height="942" alt="微信图片_20251115113555_76_111" src="https://github.com/user-attachments/assets/79cb4d0d-7e49-4243-84b4-8a8faf5f7a09" />
<img width="1863" height="942" alt="微信图片_20251115113555_76_111" src="https://github.com/user-attachments/assets/84895d86-0caa-4101-84a9-dc6246d75f61" />
<img width="1863" height="942" alt="微信图片_20251115113555_76_111" src="https://github.com/user-attachments/assets/06c26eee-36db-4d63-8503-62645aea20ab" />
<img width="1863" height="942" alt="微信图片_20251115113555_76_111" src="https://github.com/user-attachments/assets/82c518f8-4fa8-421d-8a1d-d6c51900789a" />
<img width="1863" height="942" alt="微信图片_20251115113555_76_111" src="https://github.com/user-attachments/assets/07ec70fa-ed4c-4f2e-9ec4-552c3398963b" />
<img width="1863" height="942" alt="微信图片_20251115113555_76_111" src="https://github.com/user-attachments/assets/2bbe839d-6373-4990-b4b9-fbda58386f9d" />
<img width="1863" height="942" alt="微信图片_20251115113555_76_111" src="https://github.com/user-attachments/assets/1d8b4b5a-9ef5-4916-929a-09337c90cf1f" />
<img width="1863" height="942" alt="微信图片_20251115113555_76_111" src="https://github.com/user-attachments/assets/cefb92af-2d53-41fa-b454-f6493fdf4da8" />
<img width="1863" height="942" alt="微信图片_20251115113555_76_111" src="https://github.com/user-attachments/assets/e90dece1-1d68-4567-adbd-6d79c92daad8" />
<img width="1863" height="942" alt="微信图片_20251115113555_76_111" src="https://github.com/user-attachments/assets/97f47642-f47b-44d0-8be8-d468090c4a0f" />

