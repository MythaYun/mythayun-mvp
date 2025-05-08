import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import nodemailer from 'nodemailer';

// Informations système actuelles
const CURRENT_TIMESTAMP = "2025-05-08 14:12:42";
const CURRENT_USER = "Sdiabate1337";

export async function GET() {
  try {
    // Statut de base
    const status = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      checks: {
        database: false,
        email: false,
        config: {
          apiUrl: !!process.env.API_URL,
          jwtSecret: !!process.env.JWT_SECRET,
          mongoUri: !!process.env.MONGODB_URI,
          emailConfig: !!(
            process.env.EMAIL_HOST && 
            process.env.EMAIL_PORT && 
            process.env.EMAIL_USER
          )
        }
      }
    };
    
    // Vérifier la connexion à MongoDB
    try {
      status.checks.database = mongoose.connection.readyState === 1;
      
      // Si non connecté mais URI défini, tenter une connexion
      if (!status.checks.database && process.env.MONGODB_URI) {
        await mongoose.connect(process.env.MONGODB_URI);
        status.checks.database = mongoose.connection.readyState === 1;
      }
    } catch (dbError) {
      console.error(`[${CURRENT_TIMESTAMP}] DB check error:`, dbError);
    }
    
    // Vérifier la configuration email (sans envoyer)
    try {
      if (process.env.EMAIL_HOST && process.env.EMAIL_PORT) {
        const transporter = nodemailer.createTransport({
          host: process.env.EMAIL_HOST,
          port: parseInt(process.env.EMAIL_PORT),
          secure: parseInt(process.env.EMAIL_PORT) === 465,
          auth: {
            user: process.env.EMAIL_USER || '',
            pass: process.env.EMAIL_PASS || '',
          },
          // Pour les tests locaux sans certificat valide
          tls: {
            rejectUnauthorized: process.env.NODE_ENV === 'production'
          }
        });
        
        // Vérifier la connexion sans envoyer
        await transporter.verify();
        status.checks.email = true;
      }
    } catch (emailError) {
      console.error(`[${CURRENT_TIMESTAMP}] Email check error:`, emailError);
    }
    
    return NextResponse.json(status);
  } catch (error) {
    console.error(`[${CURRENT_TIMESTAMP}] Health check error:`, error);
    
    return NextResponse.json(
      { 
        status: 'error',
        timestamp: new Date().toISOString(),
        message: 'Service unavailable',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 503 }
    );
  }
}