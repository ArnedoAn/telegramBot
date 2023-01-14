/*
  Warnings:

  - You are about to drop the column `saldoTotal` on the `Tarjeta` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Tarjeta" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "saldoDisponible" REAL NOT NULL
);
INSERT INTO "new_Tarjeta" ("id", "saldoDisponible") SELECT "id", "saldoDisponible" FROM "Tarjeta";
DROP TABLE "Tarjeta";
ALTER TABLE "new_Tarjeta" RENAME TO "Tarjeta";
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
