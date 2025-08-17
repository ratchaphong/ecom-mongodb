---
name: <collection-name>
version: 1
owner: <team-or-person>
---

## Purpose

สรุปหน้าที่ของคอลเลกชันนี้ในระบบ

## Read Patterns

- ใช้อ่านอย่างไรบ้าง (เช่น list by X, get by id, search text, รายงาน)

## Write Patterns

- ใช้เขียน/อัปเดตอย่างไร (เช่น create, update fields, soft delete)

## Document Shape (Fields)

| Field | Type     | Required | Constraints | Notes          |
| ----- | -------- | -------- | ----------- | -------------- |
| \_id  | ObjectId | yes      | pk          | สร้างอัตโนมัติ |
| ...   | ...      | ...      | ...         | ...            |

## Embed vs Reference

- Embed: อะไรบ้าง + เหตุผล
- Reference: อะไรบ้าง + เหตุผล

## Indexes

- `{ field: 1 } [unique]`
- `{ fieldA: 1, fieldB: -1 }`
  > อธิบายว่าดักคิวรีไหน

## Example Document

```json
{}
```
