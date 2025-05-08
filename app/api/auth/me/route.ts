import { NextRequest, NextResponse } from 'next/server';
import { sessionUtils } from '@/lib/auth/session';

export async function GET(request: NextRequest) {
  try {
    const user = await sessionUtils.getCurrentUser();
    
    if (user) {
      // Retourner l'utilisateur sans le mot de passe et les données sensibles
      const safeUser = {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        isVerified: user.isVerified,
        lastLogin: user.lastLogin,
        isActive: user.isActive,
        favoriteTeams: user.favoriteTeams,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      };
      
      return NextResponse.json({ success: true, user: safeUser });
    } else {
      return NextResponse.json(
        { success: false, message: 'Non authentifié' },
        { status: 401 }
      );
    }
  } catch (error) {
    console.error('Erreur API récupération utilisateur:', error);
    return NextResponse.json(
      { success: false, message: 'Erreur du serveur' },
      { status: 500 }
    );
  }
}