---
### `products.collection.md`
---

name: products
version: 1

---

## Purpose

แค็ตตาล็อกสินค้า

## Shape

| Field       | Type     | Req | Constraints                           |
| ----------- | -------- | --- | ------------------------------------- |
| \_id        | ObjectId | yes | pk                                    |
| categoryId  | ObjectId | yes | ref -> categories.\_id                |
| sku         | string   | yes | unique, trim                          |
| name        | string   | yes | trim                                  |
| status      | string   | no  | enum: ACTIVE/INACTIVE, default ACTIVE |
| price       | number   | yes | min: 0                                |
| stockQty    | number   | yes | min: 0 (int)                          |
| description | string   | no  |                                       |
| seoTitle    | string   | no  |                                       |
| seoDesc     | string   | no  |                                       |
| images      | array    | no  | **แนะนำ embed**: [{ url, alt? }]      |
| createdAt   | date     | yes | timestamps                            |
| updatedAt   | date     | yes | timestamps                            |

## Indexes

- `{ sku: 1 } unique`
- `{ categoryId: 1 }`
- `{ categoryId: 1, status: 1, updatedAt: -1 }`
- `{ categoryId: 1, price: 1 }`
- `{ status: 1, updatedAt: -1 }`

## Embed vs Reference

- **แนะนำ**: Embed `images[]` แทนการทำคอลเลกชัน `product_images`

## Example

```json
{
  "_id": "66d0...20",
  "categoryId": "66d0...10",
  "sku": "SKU-KEYB-001",
  "name": "Keyboard 75%",
  "status": "ACTIVE",
  "price": 1990,
  "stockQty": 120,
  "images": [{ "url": "https://.../1.jpg" }],
  "createdAt": "...",
  "updatedAt": "..."
}
```
