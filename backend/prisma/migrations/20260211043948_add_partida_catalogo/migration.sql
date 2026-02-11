-- CreateTable
CREATE TABLE "PartidaArancelaria" (
    "codigo" TEXT NOT NULL,
    "capitulo" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PartidaArancelaria_pkey" PRIMARY KEY ("codigo")
);

-- CreateIndex
CREATE INDEX "PartidaArancelaria_capitulo_idx" ON "PartidaArancelaria"("capitulo");

-- CreateIndex
CREATE INDEX "DeclaracionAduanera_fecha_reci_idx" ON "DeclaracionAduanera"("fecha_reci");
