/*
  Warnings:

  - The primary key for the `Historial` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to alter the column `id` on the `Historial` table. The data in that column could be lost. The data in that column will be cast from `String` to `Int`.

*/
-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Historial" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "fecha" DATETIME NOT NULL,
    "monto" REAL NOT NULL,
    "tarjetaId" TEXT NOT NULL,
    CONSTRAINT "Historial_tarjetaId_fkey" FOREIGN KEY ("tarjetaId") REFERENCES "Tarjeta" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Historial" ("fecha", "id", "monto", "tarjetaId") SELECT "fecha", "id", "monto", "tarjetaId" FROM "Historial";
DROP TABLE "Historial";
ALTER TABLE "new_Historial" RENAME TO "Historial";
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
