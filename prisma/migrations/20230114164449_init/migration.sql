-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Historial" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "fecha" DATETIME NOT NULL,
    "monto" REAL NOT NULL,
    "tarjetaId" TEXT NOT NULL,
    CONSTRAINT "Historial_tarjetaId_fkey" FOREIGN KEY ("tarjetaId") REFERENCES "Tarjeta" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Historial" ("fecha", "id", "monto", "tarjetaId") SELECT "fecha", "id", "monto", "tarjetaId" FROM "Historial";
DROP TABLE "Historial";
ALTER TABLE "new_Historial" RENAME TO "Historial";
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
