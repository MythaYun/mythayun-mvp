'use client';

import { useEffect, useState, useRef, useCallback } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { FiUser, FiLogOut, FiHome, FiClock, FiMap, FiVideo, FiInfo, FiTrendingUp, FiUsers, FiMenu } from "react-icons/fi";
import { useAuth } from "@/lib/contexts/AuthContext";
import { useModal } from "@/lib/contexts/ModalContext";
import { useRouter } from "next/navigation";


// Informations système actuelles
const CURRENT_TIMESTAMP = "2025-05-07 17:59:28";
const CURRENT_USER = "Sdiabate1337";

