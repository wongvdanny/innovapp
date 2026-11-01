-- SOLO si estás dado de alta en el ROI: inversión del sujeto pasivo en gastos de proveedores extranjeros.
-- El 303 autoliquida: IVA devengado (casillas 10/11 si es UE o 12/13 si es resto del mundo) y el mismo
-- importe como deducible (28/29). En los informes se marca «revisar con gestoría».
BEGIN;
ALTER TABLE fac_gastos      ADD COLUMN inversion_sujeto_pasivo boolean NOT NULL DEFAULT false;
ALTER TABLE fac_recurrentes ADD COLUMN inversion_sujeto_pasivo boolean NOT NULL DEFAULT false;
COMMIT;
