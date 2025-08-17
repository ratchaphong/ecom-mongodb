# Data Model Docs (MongoDB)

แนวทางและแม่แบบเอกสารออกแบบคอลเลกชันสำหรับโปรเจกต์นี้

## วิธีใช้

1. ก็อปไฟล์ `_TEMPLATE.collection.md` แล้วเปลี่ยนชื่อเป็น `<name>.collection.md`
2. กรอกส่วนต่างๆ ให้ครบ: Purpose, Fields, Indexes, Example, Critical Queries
3. ทุกครั้งที่แก้ไขโครงเอกสาร → อัปเดตไฟล์นี้ก่อนลงมือแก้โค้ดจริง (Schema/DTO)

## คำแนะนำสั้นๆ

- ออกแบบ “ตามคิวรีจริง” (query-first)
- ตัดสินใจ embed vs reference ให้ชัด พร้อมเหตุผล
- นิยาม index ตามคิวรีสำคัญ และกำกับ unique ให้ชัดเจน
- ใส่ตัวอย่างเอกสาร (example) ที่สอดคล้องกับฟิลด์จริง
