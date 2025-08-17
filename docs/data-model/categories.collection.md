---
### `categories.collection.md`
---

name: categories
version: 1

---

## Purpose

หมวดหมู่สินค้า

## Shape

| Field | Type     | Req | Constraints             |
| ----- | -------- | --- | ----------------------- |
| \_id  | ObjectId | yes | pk                      |
| name  | string   | yes | unique, trim            |
| slug  | string   | yes | unique, lowercase, trim |

## Indexes

- `{ name: 1 } unique`
- `{ slug: 1 } unique`

## Example

```json
{ "_id": "66d0...10", "name": "Keyboards", "slug": "keyboards" }
```
