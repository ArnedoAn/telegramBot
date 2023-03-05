"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const http_errors_1 = __importDefault(require("http-errors"));
const express_1 = __importDefault(require("express"));
const path_1 = __importDefault(require("path"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const morgan_1 = __importDefault(require("morgan"));
const node_telegram_bot_api_1 = __importDefault(require("node-telegram-bot-api"));
const dotenv = __importStar(require("dotenv"));
const http_1 = __importDefault(require("http"));
dotenv.config();
const operations_1 = __importStar(require("./routes/operations"));
const TARIFA = 3000;
const token = process.env.TTOKEN;
const app = (0, express_1.default)();
const bot = new node_telegram_bot_api_1.default(token, { polling: true });
// view engine setup
app.set("views", path_1.default.join(__dirname, "views"));
app.set("view engine", "jade");
app.use((0, morgan_1.default)("dev"));
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: false }));
app.use((0, cookie_parser_1.default)());
app.use(express_1.default.static(path_1.default.join(__dirname, "public")));
app.use("/", operations_1.default);
//Bot management
const options = {
    reply_markup: {
        keyboard: [[{ text: "+" }, { text: "-" }]],
        resize_keyboard: true,
    },
};
bot.onText(/\/start/, (msg) => __awaiter(void 0, void 0, void 0, function* () {
    const chatId = msg.chat.id;
    const options1 = {
        reply_markup: {
            keyboard: [[{ text: "/init" }]],
            resize_keyboard: true,
        },
    };
    const siTarjeta = yield (0, operations_1.getSaldo)(chatId.toString());
    if (siTarjeta != null) {
        bot.sendMessage(chatId, `Ya tienes una tarjeta registrada, tienes ${Math.trunc(siTarjeta.saldoDisponible / TARIFA)} pasajes.\nTu saldo actual es de $${siTarjeta.saldoDisponible}`, options);
    }
    else {
        bot.sendMessage(chatId, "Bienvenido al bot. Presiona el botón para comenzar...", options1);
    }
}));
bot.onText(/\/init/, (msg) => __awaiter(void 0, void 0, void 0, function* () {
    const chatId = msg.chat.id;
    const siTarjeta = yield (0, operations_1.getSaldo)(chatId.toString());
    if (siTarjeta != null) {
        bot.sendMessage(chatId, `Ya tienes una tarjeta registrada, tu saldo actual es de ${siTarjeta.saldoDisponible}`);
    }
    else {
        const count = yield bot.sendMessage(chatId, `Ingresa tu saldo inicial:`, {
            reply_markup: {
                force_reply: true,
            },
        });
        bot.onReplyToMessage(chatId, count.message_id, (message) => __awaiter(void 0, void 0, void 0, function* () {
            const text = message.text ? message.text : "0";
            if (verifyNumber(text) == false) {
                bot.sendMessage(chatId, `Ingresa un número válido. /init`);
                return;
            }
            if (parseFloat(text) / TARIFA < 1) {
                bot.sendMessage(chatId, `Ingresa una cantidad mayor o igual a ${TARIFA} (1 pasaje). /init`, options);
                return;
            }
            console.log(text);
            const result = yield (0, operations_1.firstRun)(parseFloat(text), chatId.toString());
            if (result) {
                yield bot.sendMessage(chatId, `Tienes, ${Math.trunc(parseFloat(text) / TARIFA)} pasajes.\nTu saldo actual es de ${parseFloat(text)}.`, options);
            }
            else {
                yield bot.sendMessage(chatId, `Ha ocurrido un error, intenta de nuevo.`);
            }
        }));
    }
}));
bot.onText(/\+/, (msg) => __awaiter(void 0, void 0, void 0, function* () {
    if ((yield verifyUser(msg.chat.id.toString())) == false) {
        bot.sendMessage(msg.chat.id, `No tienes una tarjeta registrada, usa el comando /init para crear una.`);
        return;
    }
    const chatId = msg.chat.id;
    const result = yield (0, operations_1.operation)(1, TARIFA, chatId.toString());
    if (result) {
        yield (0, operations_1.registerOperation)(-1, chatId.toString());
        bot.sendMessage(chatId, `+1, tienes ${Math.trunc(result.saldo / TARIFA)} pasajes.\nTu saldo actual es de ${result.saldo}.`, options);
    }
    else {
        bot.sendMessage(chatId, `Ha ocurrido un error, intenta de nuevo.`);
    }
}));
bot.onText(/\-/, (msg) => __awaiter(void 0, void 0, void 0, function* () {
    if ((yield verifyUser(msg.chat.id.toString())) == false) {
        bot.sendMessage(msg.chat.id, `No tienes una tarjeta registrada, usa el comando /init para crear una.`);
        return;
    }
    const chatId = msg.chat.id;
    const saldo = yield (0, operations_1.getSaldo)(chatId.toString());
    if (verifySaldo(saldo.saldoDisponible, 1 * TARIFA) == false) {
        bot.sendMessage(chatId, `No tienes saldo suficiente.`);
        return;
    }
    const result = yield (0, operations_1.operation)(-1, TARIFA, chatId.toString());
    if (result) {
        yield (0, operations_1.registerOperation)(-1, chatId.toString());
        bot.sendMessage(chatId, `-1, te quedan ${Math.trunc(result.saldo / TARIFA)} pasajes.\nTu saldo actual es de ${result.saldo}.`, options);
    }
    else {
        bot.sendMessage(chatId, `Ha ocurrido un error, intenta de nuevo.`);
    }
}));
bot.onText(/\/mas/, (msg) => __awaiter(void 0, void 0, void 0, function* () {
    if ((yield verifyUser(msg.chat.id.toString())) == false) {
        bot.sendMessage(msg.chat.id, `No tienes una tarjeta registrada, usa el comando /init para crear una.`);
        return;
    }
    const chatId = msg.chat.id;
    const ans = yield bot.sendMessage(chatId, "Cantidad de pasajes:", {
        reply_markup: {
            force_reply: true,
        },
    });
    bot.onReplyToMessage(chatId, ans.message_id, (message) => __awaiter(void 0, void 0, void 0, function* () {
        if (verifyNumber(message.text) == false) {
            bot.sendMessage(chatId, `Ingresa un número válido. /mas`);
            return;
        }
        const resp = message.text ? parseFloat(message.text) : 0;
        const result = yield (0, operations_1.operation)(resp, TARIFA, chatId.toString());
        if (result.status === "success") {
            yield (0, operations_1.registerOperation)(resp, chatId.toString());
            bot.sendMessage(chatId, `Agregado. Tienes ${Math.trunc(result.saldo / TARIFA)} pasajes.\nTu saldo actual es de $${result.saldo}.`, options);
        }
        else {
            bot.sendMessage(chatId, `Ha ocurrido un error, intenta de nuevo.`);
        }
    }));
}));
bot.onText(/\/menos/, (msg) => __awaiter(void 0, void 0, void 0, function* () {
    if ((yield verifyUser(msg.chat.id.toString())) == false) {
        console.log("no tiene tarjeta");
        bot.sendMessage(msg.chat.id, `No tienes una tarjeta registrada, usa el comando /init para crear una.`);
        return;
    }
    const chatId = msg.chat.id;
    const ans = yield bot.sendMessage(chatId, "Cantidad de pasajes:", {
        reply_markup: {
            force_reply: true,
        },
    });
    bot.onReplyToMessage(chatId, ans.message_id, (message) => __awaiter(void 0, void 0, void 0, function* () {
        if (verifyNumber(message.text) == false) {
            bot.sendMessage(chatId, `Ingresa un número válido. /menos`);
            return;
        }
        const saldo = yield (0, operations_1.getSaldo)(chatId.toString());
        const resp = message.text ? parseFloat(message.text) : 0;
        if (verifySaldo(saldo === null || saldo === void 0 ? void 0 : saldo.saldoDisponible, resp * TARIFA) == false) {
            bot.sendMessage(chatId, `No tienes saldo suficiente.\nTu saldo actual es de ${saldo === null || saldo === void 0 ? void 0 : saldo.saldoDisponible}.`, options);
            return;
        }
        const result = yield (0, operations_1.operation)(resp, TARIFA * -1, chatId.toString());
        if (result.status === "success") {
            yield (0, operations_1.registerOperation)(resp * -1, chatId.toString());
            bot.sendMessage(chatId, `Restado, te quedan ${Math.trunc(result.saldo / TARIFA)} pasajes.\nTu saldo actual es de $${result.saldo}.`);
        }
        else {
            bot.sendMessage(chatId, `Ha ocurrido un error, intenta de nuevo.`);
        }
    }));
}));
bot.onText(/\/saldo/, (msg) => __awaiter(void 0, void 0, void 0, function* () {
    if ((yield verifyUser(msg.chat.id.toString())) == false) {
        console.log("no tiene tarjeta");
        bot.sendMessage(msg.chat.id, `No tienes una tarjeta registrada, usa el comando /init para crear una.`);
        return;
    }
    const chatId = msg.chat.id;
    const result = yield (0, operations_1.getSaldo)(chatId.toString());
    if (result == null) {
        bot.sendMessage(chatId, `No tienes una tarjeta registrada, usa el comando /init para crear una.`);
    }
    else {
        bot.sendMessage(chatId, `Tienes ${Math.trunc(result.saldoDisponible / TARIFA)} pasajes. \nTu saldo actual es de $${result.saldoDisponible}.`, options);
    }
}));
bot.onText(/\/actualizar/, (msg) => __awaiter(void 0, void 0, void 0, function* () {
    if ((yield verifyUser(msg.chat.id.toString())) == false) {
        console.log("no tiene tarjeta");
        bot.sendMessage(msg.chat.id, `No tienes una tarjeta registrada, usa el comando /init para crear una.`);
        return;
    }
    const chatId = msg.chat.id;
    const ans = yield bot.sendMessage(chatId, "Nuevo saldo:", {
        reply_markup: {
            force_reply: true,
        },
    });
    bot.onReplyToMessage(chatId, ans.message_id, (message) => __awaiter(void 0, void 0, void 0, function* () {
        if (verifyNumber(message.text) == false) {
            bot.sendMessage(chatId, `Ingresa un número válido. /actualizar`);
            return;
        }
        const resp = message.text ? parseFloat(message.text) : 0;
        if (resp / TARIFA < 1) {
            bot.sendMessage(chatId, `Ingresa una cantidad mayor o igual a ${TARIFA} (1 pasaje). /actualizar`, options);
            return;
        }
        const result = yield (0, operations_1.setSaldo)(resp, chatId.toString());
        if (result) {
            bot.sendMessage(chatId, `Actualizado, tienes ${resp / TARIFA} pasajes.\nTu saldo actual es de ${resp}.`);
        }
        else {
            bot.sendMessage(chatId, `Ha ocurrido un error, intenta de nuevo`);
        }
    }));
}));
bot.onText(/\/borrarhistorial/, (msg) => __awaiter(void 0, void 0, void 0, function* () {
    if ((yield verifyUser(msg.chat.id.toString())) == false) {
        console.log("no tiene tarjeta");
        bot.sendMessage(msg.chat.id, `No tienes una tarjeta registrada, usa el comando /init para crear una.`);
        return;
    }
    const chatId = msg.chat.id;
    const result = yield (0, operations_1.deleteHistorial)(chatId.toString());
    if (result) {
        bot.sendMessage(chatId, `Historial borrado.`);
    }
    else {
        bot.sendMessage(chatId, `Ha ocurrido un error, intenta de nuevo.`);
    }
}));
bot.onText(/\/borrartarjeta/, (msg) => __awaiter(void 0, void 0, void 0, function* () {
    if ((yield verifyUser(msg.chat.id.toString())) == false) {
        console.log("no tiene tarjeta");
        bot.sendMessage(msg.chat.id, `No tienes una tarjeta registrada, usa el comando /init para crear una.`);
        return;
    }
    const chatId = msg.chat.id;
    const result = yield (0, operations_1.deleteTarjeta)(chatId.toString());
    if (result) {
        bot.sendMessage(chatId, `Tarjeta borrada.`);
    }
    else {
        bot.sendMessage(chatId, `Ha ocurrido un error, intenta de nuevo.`);
    }
}));
bot.onText(/\/historial/, (msg) => __awaiter(void 0, void 0, void 0, function* () {
    if ((yield verifyUser(msg.chat.id.toString())) == false) {
        console.log("no tiene tarjeta registrada");
        bot.sendMessage(msg.chat.id, `No tienes una tarjeta registrada, usa el comando /init para crear una.`);
        return;
    }
    const chatId = msg.chat.id;
    const result = yield (0, operations_1.getHistorial)(chatId.toString());
    const string = result
        .map(({ fecha, monto }) => `Fecha: ${formatDate(fecha)}\nMonto: $${monto}\n\n`)
        .join("");
    if (result) {
        bot.sendMessage(chatId, `Historial de transacciones:`);
        bot.sendMessage(chatId, string, options);
    }
    else {
        bot.sendMessage(chatId, `Ha ocurrido un error, intenta de nuevo.`);
    }
}));
function verifyUser(chatId) {
    return __awaiter(this, void 0, void 0, function* () {
        const result = yield (0, operations_1.getSaldo)(chatId);
        if (result) {
            return true;
        }
        else {
            return false;
        }
    });
}
//funcion para manejar fechas
function formatDate(date) {
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
    return `${day < 10 ? "0" + day : day}/${monthNames[monthIndex]}/${year} ${hours + 5}:${minutes}:${seconds}`;
}
//funcion para verificar que la operacion no de negativo
function verifySaldo(saldo, monto) {
    if (saldo - monto < 0) {
        console.log("saldo insuficiente");
        return false;
    }
    else {
        return true;
    }
}
//funcion para verificar que la entrada sea un numero
function verifyNumber(monto) {
    if (isNaN(parseFloat(monto)) || parseFloat(monto) < 0) {
        return false;
    }
    else {
        return true;
    }
}
// catch 404 and forward to error handler
app.use(function (req, res, next) {
    next((0, http_errors_1.default)(404));
});
// error handler
app.use(function (err, req, res, next) {
    // set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = req.app.get("env") === "development" ? err : {};
    // render the error page
    res.status(err.status || 500);
    res.render("error");
});
const httpServer = http_1.default.createServer(app);
const httpPort = 80;
httpServer.listen(httpPort, () => {
    console.log(`Server HTTP running on ${httpPort}`);
});
exports.default = app;
