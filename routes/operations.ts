import express, { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const router = express.Router();
const prisma = new PrismaClient();
const TARIFA = 3000;

/* GET users listing. */
router.get(
  "/api/more/:count/:id",
  async (req: Request, res: Response, next) => {
    const count = parseInt(req.params.count);
    const id = req.params.id;
    const result = await operation(count, TARIFA, id);
    if (result.status === "success") {
      const register = await registerOperation(count, id);
      if (register) {
        console.log({ result: result, register: register });
        res.send({ ...result, op_register: "success" });
      } else {
        res.send({
          status: "failed",
          error: "Error al registrar la operacion",
        });
      }
    } else {
      res.send({ status: "failed", error: "Error al realizar la operacion" });
    }
  }
);

router.get(
  "/api/less/:count/:id",
  async (req: Request, res: Response, next) => {
    const count = parseInt(req.params.count);
    const id = req.params.id;
    const result = await operation(count, TARIFA * -1, id);
    if (result.status === "success") {
      const register = await registerOperation(count, id);
      if (register) {
        console.log({ result: result, register: register });
        res.send({ ...result, op_register: "success" });
      } else {
        res.send({
          status: "failed",
          error: "Error al registrar la operacion",
        });
      }
    } else {
      res.send({ status: "failed", error: "Error al realizar la operacion" });
    }
  }
);

router.get("/api/saldo/:id", async (req: Request, res: Response, next) => {
  try {
    const id = req.params.id;
    const result = await getSaldo(id);
    console.log(result);
    res.send(result);
  } catch (err) {
    res.send({ status: "failed", error: "Error al obtener el saldo" });
  }
});

router.get("/start/:count/:id", async (req: Request, res: Response, next) => {
  const count = parseInt(req.params.count);
  const id = req.params.id;
  const result = await firstRun(count, id);
  console.log(result);
  res.send(result);
});

router.get("/", (req: Request, res: Response, next) => {
  res.send("respond with a resource");
});

export async function operation(count: number, TARIFA: number, id: string) {
  try {
    const total = count * TARIFA;
    const tarjeta = await getSaldo(id);
    const saldo = tarjeta!.saldoDisponible + total;
    const result = await prisma.tarjeta.update({
      where: {
        id: id,
      },
      data: {
        saldoDisponible: saldo,
      },
    });
    console.log(result);
    return { status: "success", saldo: result.saldoDisponible! };
  } catch (err) {
    console.log(err);
    return { status: "failed", error: err };
  }
}

export async function getSaldo(id: string) {
  try {
    const result = await prisma.tarjeta.findUnique({
      where: {
        id: id,
      },
    });
    console.log(result);
    return result;
  } catch (err) {
    console.log(err);
  }
}

export async function firstRun(saldo: number = 0, id: string) {
  try {
    const result = await prisma.tarjeta.create({
      data: {
        id: id,
        saldoDisponible: saldo,
      },
    });
    console.log(result);
    return true;
  } catch (err) {
    console.log(err);
    return false;
  }
}

export async function registerOperation(count: number, id: string) {
  try {
    const result = await prisma.historial.create({
      data: {
        fecha: setUTCDate(new Date()) ,
        monto: count * TARIFA,
        tarjetaId: id,
      },
    });
    console.log(result);
    return true;
  } catch (err) {
    console.log(err);
    return false;
  }
}


// menos 10 horas
function setUTCDate(date: Date) {
  const offset = date.getTimezoneOffset();	// offset in minutes
  const offsetInMs = offset * 60 * 1000;	// offset in milliseconds
  const utc = date.getTime() + offsetInMs;	// utc timestamp
  const newDate = new Date(utc - 10 * 60 * 60 * 1000);	// create new Date object for different city
  return newDate;
}

export async function setSaldo(saldo: number, id: string) {
  try {
    const result = await prisma.tarjeta.update({
      where: {
        id: id,
      },
      data: {
        saldoDisponible: saldo,
      },
    });
    console.log(result);
    return true;
  } catch (err) {
    console.log(err);
    return false;
  }
}

export async function getHistorial(id: string) {
  try {
    const result = await prisma.historial.findMany({
      where: {
        tarjetaId: id,
      },
    });
    console.log(result);
    return result;
  } catch (err) {
    console.log(err);
  }
}

export async function deleteHistorial(id: string) {
  try {
    const result = await prisma.historial.deleteMany({
      where: {
        tarjetaId: id,
      },
    });
    console.log(result);
    return true;
  } catch (err) {
    console.log(err);
  }
}

export async function deleteTarjeta(id: string) {
  try {
    const result = await prisma.tarjeta.deleteMany({
      where: {
        id: id,
      },
    });
    console.log(result);
    return true;
  } catch (err) {
    console.log(err);
  }
}

export default router;
