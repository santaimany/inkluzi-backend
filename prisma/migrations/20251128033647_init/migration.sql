-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('admin', 'sppg', 'sekolah');

-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('pending', 'active', 'inactive');

-- CreateEnum
CREATE TYPE "ReportStatus" AS ENUM ('processing', 'completed');

-- CreateEnum
CREATE TYPE "StatusKeamanan" AS ENUM ('aman', 'perlu_perhatian', 'tidak_aman');

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "password_hash" VARCHAR(255) NOT NULL,
    "role" "UserRole" NOT NULL,
    "status" "UserStatus" NOT NULL DEFAULT 'pending',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "refresh_tokens" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "token" VARCHAR(500) NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "refresh_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sppg_profiles" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "nama_instansi" VARCHAR(255) NOT NULL,
    "wilayah_kerja" VARCHAR(255) NOT NULL,
    "alamat" TEXT NOT NULL,
    "penanggung_jawab" VARCHAR(255) NOT NULL,
    "nomor_kontak" VARCHAR(20) NOT NULL,
    "photo_url" VARCHAR(500),
    "cloudinary_public_id" VARCHAR(255),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sppg_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "school_profiles" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "sppg_id" UUID,
    "nama_sekolah" VARCHAR(255) NOT NULL,
    "npsn" VARCHAR(20) NOT NULL,
    "jenis_sekolah" VARCHAR(50) NOT NULL,
    "alamat" TEXT NOT NULL,
    "total_siswa" INTEGER NOT NULL,
    "penanggung_jawab" VARCHAR(255) NOT NULL,
    "nomor_kontak" VARCHAR(20) NOT NULL,
    "photo_url" VARCHAR(500),
    "cloudinary_public_id" VARCHAR(255),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "school_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "disability_types" (
    "id" UUID NOT NULL,
    "school_profiles_id" UUID NOT NULL,
    "jenis_disabilitas" VARCHAR(100) NOT NULL,
    "jumlah_siswa" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "disability_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "menus" (
    "id" UUID NOT NULL,
    "sppg_id" UUID NOT NULL,
    "tanggal_disajikan" DATE NOT NULL,
    "nama_menu" VARCHAR(255) NOT NULL,
    "komponen_menu" TEXT NOT NULL,
    "kandungan_gizi" JSONB,
    "deteksi_risiko" JSONB,
    "rekomendasi" TEXT,
    "status_keamanan" "StatusKeamanan",
    "ml_confidence" REAL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "menus_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "menu_assignments" (
    "id" UUID NOT NULL,
    "menu_id" UUID NOT NULL,
    "sekolah_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "menu_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "food_scans" (
    "id" UUID NOT NULL,
    "sekolah_id" UUID NOT NULL,
    "image_url" VARCHAR(500) NOT NULL,
    "cloudinary_public_id" VARCHAR(255) NOT NULL,
    "nama_makanan" VARCHAR(255),
    "komponen_menu" TEXT,
    "kandungan_gizi" JSONB,
    "deteksi_risiko" JSONB,
    "rekomendasi" TEXT,
    "ml_confidence" REAL,
    "scanned_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "food_scans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reports" (
    "id" UUID NOT NULL,
    "sekolah_id" UUID NOT NULL,
    "sppg_id" UUID NOT NULL,
    "menu_id" UUID,
    "image_url" VARCHAR(500),
    "cloudinary_public_id" VARCHAR(255),
    "catatan" TEXT NOT NULL,
    "status" "ReportStatus" NOT NULL DEFAULT 'processing',
    "sppg_response" TEXT,
    "responded_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reports_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "refresh_tokens_token_key" ON "refresh_tokens"("token");

-- CreateIndex
CREATE UNIQUE INDEX "sppg_profiles_user_id_key" ON "sppg_profiles"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "school_profiles_user_id_key" ON "school_profiles"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "school_profiles_npsn_key" ON "school_profiles"("npsn");

-- CreateIndex
CREATE INDEX "menus_sppg_id_tanggal_disajikan_idx" ON "menus"("sppg_id", "tanggal_disajikan");

-- CreateIndex
CREATE UNIQUE INDEX "menu_assignments_menu_id_sekolah_id_key" ON "menu_assignments"("menu_id", "sekolah_id");

-- CreateIndex
CREATE INDEX "food_scans_sekolah_id_scanned_at_idx" ON "food_scans"("sekolah_id", "scanned_at");

-- CreateIndex
CREATE INDEX "reports_sekolah_id_status_idx" ON "reports"("sekolah_id", "status");

-- CreateIndex
CREATE INDEX "reports_sppg_id_status_idx" ON "reports"("sppg_id", "status");

-- AddForeignKey
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sppg_profiles" ADD CONSTRAINT "sppg_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "school_profiles" ADD CONSTRAINT "school_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "school_profiles" ADD CONSTRAINT "school_profiles_sppg_id_fkey" FOREIGN KEY ("sppg_id") REFERENCES "sppg_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "disability_types" ADD CONSTRAINT "disability_types_school_profiles_id_fkey" FOREIGN KEY ("school_profiles_id") REFERENCES "school_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "menus" ADD CONSTRAINT "menus_sppg_id_fkey" FOREIGN KEY ("sppg_id") REFERENCES "sppg_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "menu_assignments" ADD CONSTRAINT "menu_assignments_menu_id_fkey" FOREIGN KEY ("menu_id") REFERENCES "menus"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "menu_assignments" ADD CONSTRAINT "menu_assignments_sekolah_id_fkey" FOREIGN KEY ("sekolah_id") REFERENCES "school_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "food_scans" ADD CONSTRAINT "food_scans_sekolah_id_fkey" FOREIGN KEY ("sekolah_id") REFERENCES "school_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reports" ADD CONSTRAINT "reports_sekolah_id_fkey" FOREIGN KEY ("sekolah_id") REFERENCES "school_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reports" ADD CONSTRAINT "reports_sppg_id_fkey" FOREIGN KEY ("sppg_id") REFERENCES "sppg_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reports" ADD CONSTRAINT "reports_menu_id_fkey" FOREIGN KEY ("menu_id") REFERENCES "menus"("id") ON DELETE SET NULL ON UPDATE CASCADE;
