---
name: users
version: 2 # ← เปลี่ยนเป็น v2 เพราะเปลี่ยนโครงสร้างจากแยกคอลเลกชันมา embed
---

## Purpose

บัญชีผู้ใช้งาน + โปรไฟล์ + ที่อยู่ (เก็บรวมในเอกสารผู้ใช้)

## Read Patterns

- get by id/email
- list (admin) เรียงใหม่สุด
- ดึงโปรไฟล์และที่อยู่ของผู้ใช้คนเดียว (อ่านจากเอกสารเดียว)

## Write Patterns

- register (สร้าง user พร้อม profile ว่าง และ/หรือ cart ภายหลัง)
- update profile (`$set: { profile.* }`)
- จัดการที่อยู่: add (`$push`), edit (`$set` + arrayFilters), delete (`$pull`), set default (clear ทั้งหมดแล้วตั้งตัวเดียว)

## Document Shape

| Field        | Type     | Required | Constraints / Notes                                   |
| ------------ | -------- | -------- | ----------------------------------------------------- |
| \_id         | ObjectId | yes      | pk                                                    |
| email        | string   | yes      | unique, lowercase, trim                               |
| passwordHash | string   | yes      | hashed                                                |
| role         | string   | no       | enum: USER/ADMIN, default USER                        |
| profile      | object   | no       | **embed** `{ name?, phone?, birthDate?, avatarUrl? }` |
| addresses    | array    | no       | **embed** `Address[]` (ดูโครงย่อยด้านล่าง)            |
| createdAt    | date     | yes      | timestamps                                            |
| updatedAt    | date     | yes      | timestamps                                            |
| deletedAt    | date     | no       | null = active                                         |

**Embedded: Address**
| Field | Type | Required | Constraints / Notes |
|-----------|----------|----------|-----------------------------------------------|
| \_id | ObjectId | yes | สร้างไอดีให้แต่ละที่อยู่ (ใช้อ้างอิงเวลาปรับแก้/ลบ) |
| label | string | no | เช่น “บ้าน”, “ที่ทำงาน” |
| line1 | string | yes | |
| province | string | yes | |
| postcode | string | yes | |
| isDefault | boolean | no | default: false — **คุมความเป็นเอกภาพในแอป** |

> ถ้าต้องการเวลาในแต่ละ address ให้เพิ่มฟิลด์ `createdAt`, `updatedAt` ใน subdoc ด้วย (Mongoose ไม่ใส่ timestamps ให้อัตโนมัติใน subdocument)

## Indexes

- `{ email: 1 } unique`
- `{ createdAt: -1 }`
- `{ role: 1, createdAt: -1 }`
- `{ deletedAt: 1, createdAt: -1 }`
- _(ตัวเลือก)_ ถ้าจะค้นหาที่อยู่เจาะจงข้ามผู้ใช้จำนวนมาก: `{ 'addresses.postcode': 1 }` (multikey)

> หมายเหตุ: กติกา “มี default ได้แค่ 1 รายการ” ทำที่ **business logic** (MongoDB ไม่บังคับเอกภาพใน array ได้เอง)

## Embed vs Reference

- ใช้ **embed** สำหรับ `profile` และ `addresses` เพื่อลดการ join/lookup และอ่านจบใน doc เดียว
- ไม่ต้องมีคอลเลกชัน `profiles`/`addresses` แยกอีกต่อไปในรุ่นนี้

## Example

```json
{
  "_id": "66d0...01",
  "email": "user@example.com",
  "passwordHash": "<bcrypt>",
  "role": "USER",
  "profile": {
    "name": "Alice",
    "phone": "0800000000",
    "birthDate": "1999-01-01",
    "avatarUrl": "https://cdn.example.com/a.jpg"
  },
  "addresses": [
    {
      "_id": "66d0...a1",
      "label": "บ้าน",
      "line1": "123/4",
      "province": "กรุงเทพฯ",
      "postcode": "10220",
      "isDefault": true
    },
    {
      "_id": "66d0...a2",
      "label": "ที่ทำงาน",
      "line1": "อาคาร B ชั้น 12",
      "province": "กรุงเทพฯ",
      "postcode": "10330",
      "isDefault": false
    }
  ],
  "createdAt": "2025-08-16T12:41:04.810Z",
  "updatedAt": "2025-08-16T12:45:10.100Z",
  "deletedAt": null
}
```
