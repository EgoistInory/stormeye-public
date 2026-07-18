# StormEye Public

这是 [StormEye · 中国台风态势](https://stormeye-china.shallhu.chatgpt.site) 的极小公共配套仓库，只承担两项公开能力：

- 提供生产 API 不可用时使用的中央气象台台风数据容灾快照。
- 提供工作室、企业、公益组织和政府机构的公开初步合作咨询入口。

完整产品源码、部署配置和内部开发资料不在本仓库公开。

## 公开气象快照

快照地址：

```text
https://raw.githubusercontent.com/EgoistInory/stormeye-public/main/public/data/nmc-latest.json
```

GitHub Actions 原则上每小时检查一次中央气象台公开数据。只有有效观测发生变化时才提交新快照；上游请求失败或数据无法通过校验时，保留上一次有效文件。

GitHub 计划任务和上游网络可能延迟。本仓库不是官方预警服务，防灾决策必须以气象部门正式发布为准。

## 组织合作

请使用 [组织合作 Issue 表单](https://github.com/EgoistInory/stormeye-public/issues/new?template=organization-cooperation.yml) 公开说明机构名称和合作方向。

Issue 仅用于初步接洽。请勿提交合同、电话、证件、银行账户或其他敏感资料；正式合作款不通过个人支持二维码收取。

## 数据来源与责任边界

- 数据来源：[中央气象台台风网](https://typhoon.nmc.cn/)
- 更新方式：公开 GitHub Actions，尽力每小时检查
- 使用限制：详见 [DISCLAIMER.md](DISCLAIMER.md)
