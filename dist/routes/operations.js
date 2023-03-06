"use strict";
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
exports.deleteTarjeta = exports.deleteHistorial = exports.getHistorial = exports.setSaldo = exports.registerOperation = exports.firstRun = exports.getSaldo = exports.operation = void 0;
const express_1 = __importDefault(require("express"));
const client_1 = require("@prisma/client");
const router = express_1.default.Router();
const prisma = new client_1.PrismaClient();
const TARIFA = 3000;
/* GET users listing. */
router.get("/", (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    res.render("welcome");
}));
router.get("/api/more/:count/:id", (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const count = parseInt(req.params.count);
    const id = req.params.id;
    const result = yield operation(count, TARIFA, id);
    if (result.status === "success") {
        const register = yield registerOperation(count, id);
        if (register) {
            console.log({ result: result, register: register });
            res.send(Object.assign(Object.assign({}, result), { op_register: "success" }));
        }
        else {
            res.send({
                status: "failed",
                error: "Error al registrar la operacion",
            });
        }
    }
    else {
        res.send({ status: "failed", error: "Error al realizar la operacion" });
    }
}));
router.get("/api/less/:count/:id", (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const count = parseInt(req.params.count);
    const id = req.params.id;
    const result = yield operation(count, TARIFA * -1, id);
    if (result.status === "success") {
        const register = yield registerOperation(count, id);
        if (register) {
            console.log({ result: result, register: register });
            res.send(Object.assign(Object.assign({}, result), { op_register: "success" }));
        }
        else {
            res.send({
                status: "failed",
                error: "Error al registrar la operacion",
            });
        }
    }
    else {
        res.send({ status: "failed", error: "Error al realizar la operacion" });
    }
}));
router.get("/api/saldo/:id", (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const id = req.params.id;
        const result = yield getSaldo(id);
        console.log(result);
        res.send(result);
    }
    catch (err) {
        res.send({ status: "failed", error: "Error al obtener el saldo" });
    }
}));
router.get("/start/:count/:id", (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const count = parseInt(req.params.count);
    const id = req.params.id;
    const result = yield firstRun(count, id);
    console.log(result);
    res.send(result);
}));
function operation(count, TARIFA, id) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const total = count * TARIFA;
            const tarjeta = yield getSaldo(id);
            const saldo = tarjeta.saldoDisponible + total;
            const result = yield prisma.tarjeta.update({
                where: {
                    id: id,
                },
                data: {
                    saldoDisponible: saldo,
                },
            });
            console.log(result);
            return { status: "success", saldo: result.saldoDisponible };
        }
        catch (err) {
            console.log(err);
            return { status: "failed", error: err };
        }
    });
}
exports.operation = operation;
function getSaldo(id) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const result = yield prisma.tarjeta.findUnique({
                where: {
                    id: id,
                },
            });
            console.log(result);
            return result;
        }
        catch (err) {
            console.log(err);
        }
    });
}
exports.getSaldo = getSaldo;
function firstRun(saldo = 0, id) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const result = yield prisma.tarjeta.create({
                data: {
                    id: id,
                    saldoDisponible: saldo,
                },
            });
            console.log(result);
            return true;
        }
        catch (err) {
            console.log(err);
            return false;
        }
    });
}
exports.firstRun = firstRun;
function registerOperation(count, id) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const result = yield prisma.historial.create({
                data: {
                    fecha: setUTCDate(new Date()),
                    monto: count * TARIFA,
                    tarjetaId: id,
                },
            });
            console.log(result);
            return true;
        }
        catch (err) {
            console.log(err);
            return false;
        }
    });
}
exports.registerOperation = registerOperation;
// menos 10 horas
function setUTCDate(date) {
    const offset = date.getTimezoneOffset(); // offset in minutes
    const offsetInMs = offset * 60 * 1000; // offset in milliseconds
    const utc = date.getTime() + offsetInMs; // utc timestamp
    const newDate = new Date(utc - 10 * 60 * 60 * 1000); // create new Date object for different city
    return newDate;
}
function setSaldo(saldo, id) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const result = yield prisma.tarjeta.update({
                where: {
                    id: id,
                },
                data: {
                    saldoDisponible: saldo,
                },
            });
            console.log(result);
            return true;
        }
        catch (err) {
            console.log(err);
            return false;
        }
    });
}
exports.setSaldo = setSaldo;
function getHistorial(id) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const result = yield prisma.historial.findMany({
                where: {
                    tarjetaId: id,
                },
            });
            console.log(result);
            return result;
        }
        catch (err) {
            console.log(err);
        }
    });
}
exports.getHistorial = getHistorial;
function deleteHistorial(id) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const result = yield prisma.historial.deleteMany({
                where: {
                    tarjetaId: id,
                },
            });
            console.log(result);
            return true;
        }
        catch (err) {
            console.log(err);
        }
    });
}
exports.deleteHistorial = deleteHistorial;
function deleteTarjeta(id) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const result = yield prisma.tarjeta.delete({
                where: {
                    id: id,
                },
            });
            console.log(result);
            return true;
        }
        catch (err) {
            console.log(err);
        }
    });
}
exports.deleteTarjeta = deleteTarjeta;
exports.default = router;
