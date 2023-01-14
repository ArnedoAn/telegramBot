import express, { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const router = express.Router();
const prisma = new PrismaClient();
const TARIFA = 3000;

/* GET users listing. */
router.get("/api/more/:count", async (req: Request, res: Response, next) => {
  const count = parseInt(req.params.count);
  const result = await operation(count, TARIFA);
  if (result.status === "success") {
    const register = await registerOperation(count);
    if (register) {
      res.send({ ...result, op_register: "success" });
    } else {
      res.send({ status: "failed", error: "Error al registrar la operacion" });
    }
  } else {
    res.send({ status: "failed", error: "Error al realizar la operacion" });
  }
});

router.get("/api/less/:count", async (req: Request, res: Response, next) => {
  const count = parseInt(req.params.count);
  const result = await operation(count, TARIFA * -1);
  if (result.status === "success") {
    const register = await registerOperation(count);
    if (register) {
      res.send({ ...result, op_register: "success" });
    } else {
      res.send({ status: "failed", error: "Error al registrar la operacion" });
    }
  } else {
    res.send({ status: "failed", error: "Error al realizar la operacion" });
  }
});

router.get("/api/saldo", async (req: Request, res: Response, next) => {
  try {
    const result = await getSaldo();
    res.send(result);
  } catch (err) {
    res.send({ status: "failed", error: "Error al obtener el saldo" });
  }
});

router.get("/start", async (req: Request, res: Response, next) => {
  const result = await firstRun();
  res.send(result);
});

router.get("/", (req: Request, res: Response, next) => {
  res.send("respond with a resource");
});

export async function operation(count: number, TARIFA: number) {
  try {
    const total = count * TARIFA;
    const tarjeta = await getSaldo();
    const saldo = tarjeta!.saldoDisponible + total;
    const result = await prisma.tarjeta.update({
      where: {
        id: 1,
      },
      data: {
        saldoDisponible: saldo,
      },
    });
    return { status: "success", saldo: result.saldoDisponible! };
  } catch (err) {
    console.log(err);
    return { status: "failed", error: err };
  }
}

export async function getSaldo() {
  try {
    const result = await prisma.tarjeta.findUnique({
      where: {
        id: 1,
      },
    });
    return result;
  } catch (err) {
    console.log(err);
  }
}

async function firstRun() {
  try {
    const result = await prisma.tarjeta.create({
      data: {
        saldoTotal: 0,
        saldoDisponible: 0,
      },
    });
    console.log(result);
    return true;
  } catch (err) {
    console.log(err);
    return false;
  }
}

export async function registerOperation(count: number) {
  try {
    const result = await prisma.historial.create({
      data: {
        fecha: new Date(),
        monto: count * TARIFA,
      },
    });
    console.log(result);
    return true;
  } catch (err) {
    console.log(err);
    return false;
  }
}

export async function setSaldo(saldo: number) {
  try {
    const result = await prisma.tarjeta.update({
      where: {
        id: 1,
      },
      data: {
        saldoDisponible: saldo,
      },
    });
    return true;
  } catch (err) {
    console.log(err);
    return false;
  }
}
export default router;
