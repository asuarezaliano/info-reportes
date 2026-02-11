-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DeclaracionAduanera" (
    "id" TEXT NOT NULL,
    "desadu" TEXT,
    "aduana" TEXT,
    "anio" INTEGER,
    "serial" TEXT,
    "nro_consec" TEXT,
    "nro_item" INTEGER,
    "partida_ar" TEXT,
    "unid_med" TEXT,
    "descripcio" TEXT,
    "pais_orige" TEXT,
    "acuerdo_co" TEXT,
    "regimen" INTEGER,
    "p_bruto" DECIMAL(18,2),
    "p_neto" DECIMAL(18,2),
    "cantidad" DECIMAL(18,2),
    "estado_mer" TEXT,
    "cif_item" DECIMAL(18,2),
    "flete_item" DECIMAL(18,2),
    "seg_item" DECIMAL(18,2),
    "gast_item" DECIMAL(18,2),
    "fob" DECIMAL(18,2),
    "cif" DECIMAL(18,2),
    "importador" TEXT,
    "nit_desp" TEXT,
    "despachant" TEXT,
    "proveedor" TEXT,
    "pais_pro" TEXT,
    "depto_des" TEXT,
    "fecha_reg" TIMESTAMP(3),
    "mes" TEXT,
    "canal" TEXT,
    "tipo_proc" TEXT,
    "embarque" TEXT,
    "adu_ing" TEXT,
    "fecha_reci" TIMESTAMP(3),
    "datosExtra" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DeclaracionAduanera_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "DeclaracionAduanera_pais_orige_idx" ON "DeclaracionAduanera"("pais_orige");

-- CreateIndex
CREATE INDEX "DeclaracionAduanera_importador_idx" ON "DeclaracionAduanera"("importador");

-- CreateIndex
CREATE INDEX "DeclaracionAduanera_mes_idx" ON "DeclaracionAduanera"("mes");

-- CreateIndex
CREATE INDEX "DeclaracionAduanera_fecha_reg_idx" ON "DeclaracionAduanera"("fecha_reg");

-- CreateIndex
CREATE INDEX "DeclaracionAduanera_partida_ar_idx" ON "DeclaracionAduanera"("partida_ar");

-- CreateIndex
CREATE INDEX "DeclaracionAduanera_depto_des_idx" ON "DeclaracionAduanera"("depto_des");
