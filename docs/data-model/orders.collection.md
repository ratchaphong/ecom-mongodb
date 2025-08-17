---
name: orders
version: 1
owner: checkout-team
---

## Purpose

เก็บข้อมูลคำสั่งซื้อแบบ snapshot (สินค้า/ราคา/ที่อยู่ ณ เวลาสั่ง)  
ใช้สำหรับ fulfillment, การชำระเงิน, และรายงานย้อนหลัง

## Read Patterns

- get by `_id` หรือ `orderNo`
- list orders by `userId` (history)
- filter by `status` (PENDING/PAID/SHIPPED/DELIVERED)
- รายงานยอดขายรายวัน/เดือน

## Write Patterns

- create order จาก cart ที่ checkout
- update status (`PENDING` → `PAID` → `SHIPPED` → …)
- append timeline events
- soft cancel (`status: CANCELLED`)

## Document Shape (Fields)

| Field         | Type     | Required | Constraints | Notes                      |
| ------------- | -------- | -------- | ----------- | -------------------------- |
| `_id`         | ObjectId | yes      | pk          | สร้างอัตโนมัติ             |
| `orderNo`     | string   | yes      | unique      | เช่น `ORD-2025-000123`     |
| `userId`      | ObjectId | yes      | index       | ref → users.\_id           |
| `status`      | string   | yes      | enum        | PENDING/PAID/CANCELLED/... |
| `items`       | array    | yes      | non-empty   | **embed** snapshot สินค้า  |
| `totalAmount` | number   | yes      | min: 0      |
| `createdAt`   | date     | yes      | timestamps  |                            |
| `updatedAt`   | date     | yes      | timestamps  |                            |

## Embed vs Reference

- **Embed:** `items` → snapshot สินค้า, ราคาตอนซื้อ
- **Reference:** `userId` → users, ภายนอกใช้ ref เพื่อ join

## Indexes

- `{ orderNo: 1 } unique`
- `{ userId: 1, createdAt: -1 }` → ประวัติ order ของผู้ใช้
- `{ status: 1, createdAt: -1 }` → query รายงานตามสถานะ

## Example Document

```json
{
  "_id": "66e01234abcd9001ff223344",
  "orderNo": "ORD-2025-000123",
  "userId": "66d0aa22bbccff0011223344",
  "status": "PENDING",
  "items": [
    {
      "productId": "66c0aa11ccdd990022334455",
      "name": "iPhone 16 Pro",
      "priceAtPurchase": 38900,
      "qty": 1
    },
    {
      "productId": "66c0aa11ccdd990022334466",
      "name": "AirPods Pro 3",
      "priceAtPurchase": 9990,
      "qty": 1
    }
  ],
  "totalAmount": 48890,
  "createdAt": "2025-08-17T01:20:00Z",
  "updatedAt": "2025-08-17T01:20:00Z"
}
```
