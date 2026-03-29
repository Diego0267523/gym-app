import express from "express";
import axios from "axios";
import multer from "multer";

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// Configuración de LogMeal
const LOGMEAL_API_KEY = process.env.LOGMEAL_API_KEY;
const LOGMEAL_BASE = "https://api.logmeal.com/v2";

// Headers comunes
const logmealHeaders = {
  "Authorization": `Bearer ${LOGMEAL_API_KEY}`
};