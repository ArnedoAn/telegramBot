/*
  Warnings:

  - The primary key for the `Tarjeta` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - Added the required column `tarjetaId` to the `Historial` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Tarjeta" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "saldoDisponible" REAL NOT NULL
);
INSERT INTO "new_Tarjeta" ("id", "saldoDisponible") SELECT "id", "saldoDisponible" FROM "Tarjeta";
DROP TABLE "Tarjeta";
ALTER TABLE "new_Tarjeta" RENAME TO "Tarjeta";
CREATE TABLE "new_Historial" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "fecha" DATETIME NOT NULL,
    "monto" REAL NOT NULL,
    "tarjetaId" TEXT NOT NULL,
    CONSTRAINT "Historial_tarjetaId_fkey" FOREIGN KEY ("tarjetaId") REFERENCES "Tarjeta" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Historial" ("fecha", "id", "monto") SELECT "fecha", "id", "monto" FROM "Historial";
DROP TABLE "Historial";
ALTER TABLE "new_Historial" RENAME TO "Historial";
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
