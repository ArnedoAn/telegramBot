-- CreateTable
CREATE TABLE "Tarjeta" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "saldoTotal" REAL NOT NULL,
    "saldoDisponible" REAL NOT NULL
);

-- CreateTable
CREATE TABLE "Historial" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "fecha" DATETIME NOT NULL,
    "monto" REAL NOT NULL
);
