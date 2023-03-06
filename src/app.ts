import createError from "http-errors";
import express, { Request, Response } from "express";
import path from "path";
import cookieParser from "cookie-parser";
import logger from "morgan";
import TelegramBot from "node-telegram-bot-api";
import * as dotenv from "dotenv";
import http from "http";

dotenv.config();

import opRouter, {
  operation,
  registerOperation,
  getSaldo,
  setSaldo,
  firstRun,
  deleteHistorial,
  deleteTarjeta,
  getHistorial,
} from "./routes/operations";

const TARIFA = 3000;
const token = process.env.TTOKEN!;
const app = express();
const bot = new TelegramBot(token, { polling: true });

// view engine setup
app.set("views", path.join(__dirname, "../src/views"));
app.set("view engine", "jade");

app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "../src/public")));

app.use("/", opRouter);

//Bot management
const options = {
  reply_markup: {
    keyboard: [[{ text: "+" }, { text: "-" }]],
    resize_keyboard: true,
  },
};

bot.onText(/\/start/, async (msg) => {
  const chatId = msg.chat.id;
  const options1 = {
    reply_markup: {
      keyboard: [[{ text: "/init" }]],
      resize_keyboard: true,
    },
  };
  const siTarjeta = await getSaldo(chatId.toString());
  if (siTarjeta != null) {
    bot.sendMessage(
      chatId,
      `Ya tienes una tarjeta registrada, tienes ${Math.trunc(
        siTarjeta.saldoDisponible / TARIFA
      )} pasajes.\nTu saldo actual es de $${siTarjeta.saldoDisponible}`,
      options
    );
  } else {
    bot.sendMessage(
      chatId,
      "Bienvenido al bot. Presiona el botón para comenzar...",
      options1
    );
  }
});

bot.onText(/\/init/, async (msg) => {
  const chatId = msg.chat.id;
  const siTarjeta = await getSaldo(chatId.toString());
  if (siTarjeta != null) {
    bot.sendMessage(
      chatId,
      `Ya tienes una tarjeta registrada, tu saldo actual es de ${siTarjeta.saldoDisponible}`
    );
  } else {
    const count = await bot.sendMessage(chatId, `Ingresa tu saldo inicial:`, {
      reply_markup: {
        force_reply: true,
      },
    });
    bot.onReplyToMessage(chatId, count.message_id, async (message) => {
      const text = message.text ? message.text : "0";
      if (verifyNumber(text) == false) {
        bot.sendMessage(chatId, `Ingresa un número válido. /init`);
        return;
      }
      if (parseFloat(text) / TARIFA < 1) {
        bot.sendMessage(
          chatId,
          `Ingresa una cantidad mayor o igual a ${TARIFA} (1 pasaje). /init`,
          options
        );
        return;
      }
      console.log(text);
      const result = await firstRun(parseFloat(text), chatId.toString());
      if (result) {
        await bot.sendMessage(
          chatId,
          `Tienes, ${Math.trunc(
            parseFloat(text) / TARIFA
          )} pasajes.\nTu saldo actual es de ${parseFloat(text)}.`,
          options
        );
      } else {
        await bot.sendMessage(
          chatId,
          `Ha ocurrido un error, intenta de nuevo.`
        );
      }
    });
  }
});

bot.onText(/\+/, async (msg) => {
  if ((await verifyUser(msg.chat.id.toString())) == false) {
    bot.sendMessage(
      msg.chat.id,
      `No tienes una tarjeta registrada, usa el comando /init para crear una.`
    );
    return;
  }
  const chatId = msg.chat.id;
  const result = await operation(1, TARIFA, chatId.toString());
  if (result) {
    await registerOperation(-1, chatId.toString());
    bot.sendMessage(
      chatId,
      `+1, tienes ${Math.trunc(
        result.saldo! / TARIFA
      )} pasajes.\nTu saldo actual es de ${result.saldo}.`,
      options
    );
  } else {
    bot.sendMessage(chatId, `Ha ocurrido un error, intenta de nuevo.`);
  }
});

bot.onText(/\-/, async (msg) => {
  if ((await verifyUser(msg.chat.id.toString())) == false) {
    bot.sendMessage(
      msg.chat.id,
      `No tienes una tarjeta registrada, usa el comando /init para crear una.`
    );
    return;
  }
  const chatId = msg.chat.id;
  const saldo = await getSaldo(chatId.toString());
  if (verifySaldo(saldo!.saldoDisponible, 1 * TARIFA) == false) {
    bot.sendMessage(chatId, `No tienes saldo suficiente.`);
    return;
  }
  const result = await operation(-1, TARIFA, chatId.toString());
  if (result) {
    await registerOperation(-1, chatId.toString());
    bot.sendMessage(
      chatId,
      `-1, te quedan ${Math.trunc(
        result.saldo! / TARIFA
      )} pasajes.\nTu saldo actual es de ${result.saldo}.`,
      options
    );
  } else {
    bot.sendMessage(chatId, `Ha ocurrido un error, intenta de nuevo.`);
  }
});

bot.onText(/\/mas/, async (msg) => {
  if ((await verifyUser(msg.chat.id.toString())) == false) {
    bot.sendMessage(
      msg.chat.id,
      `No tienes una tarjeta registrada, usa el comando /init para crear una.`
    );
    return;
  }
  const chatId = msg.chat.id;
  const ans = await bot.sendMessage(chatId, "Cantidad de pasajes:", {
    reply_markup: {
      force_reply: true,
    },
  });
  bot.onReplyToMessage(chatId, ans.message_id, async (message) => {
    if (verifyNumber(message.text!) == false) {
      bot.sendMessage(chatId, `Ingresa un número válido. /mas`);
      return;
    }
    const resp = message.text ? parseFloat(message.text) : 0;
    const result = await operation(resp, TARIFA, chatId.toString());
    if (result.status === "success") {
      await registerOperation(resp, chatId.toString());
      bot.sendMessage(
        chatId,
        `Agregado. Tienes ${Math.trunc(
          result.saldo! / TARIFA
        )} pasajes.\nTu saldo actual es de $${result.saldo}.`,
        options
      );
    } else {
      bot.sendMessage(chatId, `Ha ocurrido un error, intenta de nuevo.`);
    }
  });
});

bot.onText(/\/menos/, async (msg) => {
  if ((await verifyUser(msg.chat.id.toString())) == false) {
    console.log("no tiene tarjeta");
    bot.sendMessage(
      msg.chat.id,
      `No tienes una tarjeta registrada, usa el comando /init para crear una.`
    );
    return;
  }
  const chatId = msg.chat.id;
  const ans = await bot.sendMessage(chatId, "Cantidad de pasajes:", {
    reply_markup: {
      force_reply: true,
    },
  });
  bot.onReplyToMessage(chatId, ans.message_id, async (message) => {
    if (verifyNumber(message.text!) == false) {
      bot.sendMessage(chatId, `Ingresa un número válido. /menos`);
      return;
    }
    const saldo = await getSaldo(chatId.toString());
    const resp = message.text ? parseFloat(message.text) : 0;
    if (verifySaldo(saldo?.saldoDisponible!, resp * TARIFA) == false) {
      bot.sendMessage(
        chatId,
        `No tienes saldo suficiente.\nTu saldo actual es de ${saldo?.saldoDisponible}.`,
        options
      );
      return;
    }
    const result = await operation(resp, TARIFA * -1, chatId.toString());
    if (result.status === "success") {
      await registerOperation(resp * -1, chatId.toString());
      bot.sendMessage(
        chatId,
        `Restado, te quedan ${Math.trunc(
          result.saldo! / TARIFA
        )} pasajes.\nTu saldo actual es de $${result.saldo}.`
      );
    } else {
      bot.sendMessage(chatId, `Ha ocurrido un error, intenta de nuevo.`);
    }
  });
});

bot.onText(/\/saldo/, async (msg) => {
  if ((await verifyUser(msg.chat.id.toString())) == false) {
    console.log("no tiene tarjeta");
    bot.sendMessage(
      msg.chat.id,
      `No tienes una tarjeta registrada, usa el comando /init para crear una.`
    );
    return;
  }
  const chatId = msg.chat.id;
  const result = await getSaldo(chatId.toString());
  if (result == null) {
    bot.sendMessage(
      chatId,
      `No tienes una tarjeta registrada, usa el comando /init para crear una.`
    );
  } else {
    bot.sendMessage(
      chatId,
      `Tienes ${Math.trunc(
        result.saldoDisponible / TARIFA
      )} pasajes. \nTu saldo actual es de $${result.saldoDisponible}.`,
      options
    );
  }
});

bot.onText(/\/actualizar/, async (msg) => {
  if ((await verifyUser(msg.chat.id.toString())) == false) {
    console.log("no tiene tarjeta");
    bot.sendMessage(
      msg.chat.id,
      `No tienes una tarjeta registrada, usa el comando /init para crear una.`
    );
    return;
  }
  const chatId = msg.chat.id;
  const ans = await bot.sendMessage(chatId, "Nuevo saldo:", {
    reply_markup: {
      force_reply: true,
    },
  });
  bot.onReplyToMessage(chatId, ans.message_id, async (message) => {
    if (verifyNumber(message.text!) == false) {
      bot.sendMessage(chatId, `Ingresa un número válido. /actualizar`);
      return;
    }
    const resp = message.text ? parseFloat(message.text) : 0;
    if (resp / TARIFA < 1) {
      bot.sendMessage(
        chatId,
        `Ingresa una cantidad mayor o igual a ${TARIFA} (1 pasaje). /actualizar`,
        options
      );
      return;
    }
    const result = await setSaldo(resp, chatId.toString());
    if (result) {
      bot.sendMessage(
        chatId,
        `Actualizado, tienes ${
          resp / TARIFA
        } pasajes.\nTu saldo actual es de ${resp}.`
      );
    } else {
      bot.sendMessage(chatId, `Ha ocurrido un error, intenta de nuevo`);
    }
  });
});

bot.onText(/\/borrarhistorial/, async (msg) => {
  if ((await verifyUser(msg.chat.id.toString())) == false) {
    console.log("no tiene tarjeta");
    bot.sendMessage(
      msg.chat.id,
      `No tienes una tarjeta registrada, usa el comando /init para crear una.`
    );
    return;
  }
  const chatId = msg.chat.id;
  const result = await deleteHistorial(chatId.toString());
  if (result) {
    bot.sendMessage(chatId, `Historial borrado.`);
  } else {
    bot.sendMessage(chatId, `Ha ocurrido un error, intenta de nuevo.`);
  }
});

bot.onText(/\/borrartarjeta/, async (msg) => {
  if ((await verifyUser(msg.chat.id.toString())) == false) {
    console.log("no tiene tarjeta");
    bot.sendMessage(
      msg.chat.id,
      `No tienes una tarjeta registrada, usa el comando /init para crear una.`
    );
    return;
  }
  const chatId = msg.chat.id;
  const result = await deleteTarjeta(chatId.toString());
  if (result) {
    bot.sendMessage(chatId, `Tarjeta borrada.`);
  } else {
    bot.sendMessage(chatId, `Ha ocurrido un error, intenta de nuevo.`);
  }
});

bot.onText(/\/historial/, async (msg) => {
  if ((await verifyUser(msg.chat.id.toString())) == false) {
    console.log("no tiene tarjeta registrada");
    bot.sendMessage(
      msg.chat.id,
      `No tienes una tarjeta registrada, usa el comando /init para crear una.`
    );
    return;
  }
  const chatId = msg.chat.id;
  const result = await getHistorial(chatId.toString());
  const string = result!
    .map(
      ({ fecha, monto }: { fecha: Date; monto: Number }) =>
        `Fecha: ${formatDate(fecha)}\nMonto: $${monto}\n\n`
    )
    .join("");
  if (result) {
    bot.sendMessage(chatId, `Historial de transacciones:`);
    bot.sendMessage(chatId, string, options);
  } else {
    bot.sendMessage(chatId, `Ha ocurrido un error, intenta de nuevo.`);
  }
});

async function verifyUser(chatId: string) {
  const result = await getSaldo(chatId);
  if (result) {
    return true;
  } else {
    return false;
  }
}

//funcion para manejar fechas
function formatDate(date: Date) {
  let monthNames = [
    "Enero",
    "Febrero",
    "Marzo",
    "Abril",
    "Mayo",
    "Junio",
    "Julio",
    "Agosto",
    "Septiembre",
    "Octubre",
    "Noviembre",
    "Diciembre",
  ];

  let day = date.getDate();
  let monthIndex = date.getMonth();
  let year = date.getFullYear();

  let hours = date.getHours();
  let minutes = date.getMinutes();
  let seconds = date.getSeconds();

  return `${day < 10 ? "0" + day : day}/${monthNames[monthIndex]}/${year} ${
    hours + 5
  }:${minutes}:${seconds}`;
}

//funcion para verificar que la operacion no de negativo
function verifySaldo(saldo: number, monto: number) {
  if (saldo - monto < 0) {
    console.log("saldo insuficiente");
    return false;
  } else {
    return true;
  }
}

//funcion para verificar que la entrada sea un numero
function verifyNumber(monto: string) {
  if (isNaN(parseFloat(monto)) || parseFloat(monto) < 0) {
    return false;
  } else {
    return true;
  }
}

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err: any, req: Request, res: Response, next: any) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render("error");
});

const httpServer = http.createServer(app);
const httpPort = 3000;
httpServer.listen(httpPort, () => {
  console.log(`Server HTTP running on ${httpPort}`);
});

export default app;
