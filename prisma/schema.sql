-- Manual schema for Supabase (Postgres)
-- Matches prisma/schema.prisma

create table if not exists "Domain" (
  "id" text primary key,
  "name" text not null
);

create table if not exists "Feature" (
  "id" text primary key,
  "name" text not null,
  "domainId" text not null references "Domain"("id") on update cascade on delete restrict
);

create table if not exists "ProductFunction" (
  "id" text primary key,
  "name" text not null,
  "nameCn" text,
  "descriptionEn" text,
  "descriptionCn" text,
  "featureId" text not null references "Feature"("id") on update cascade on delete restrict,
  "tags" text[] not null default '{}',
  "createdAt" timestamptz default now()
);

create table if not exists "TechnicalFunction" (
  "id" text primary key,
  "name" text not null,
  "description" text,
  "state" text,
  "progressPercent" int not null default 0,
  "productFunctionId" text references "ProductFunction"("id") on update cascade on delete set null
);

create table if not exists "UseCase" (
  "id" text primary key,
  "name" text not null,
  "description" text,
  "hmxInput" text,
  "hmxOutput" text,
  "customerPdFeature" text,
  "technicalFunctionRaw" text
);

create table if not exists "UseCaseTechnicalFunction" (
  "useCaseId" text not null references "UseCase"("id") on update cascade on delete cascade,
  "technicalFunctionId" text not null references "TechnicalFunction"("id") on update cascade on delete cascade,
  primary key ("useCaseId", "technicalFunctionId")
);

create index if not exists "idx_Feature_domainId" on "Feature" ("domainId");
create index if not exists "idx_ProductFunction_featureId" on "ProductFunction" ("featureId");
create index if not exists "idx_TechnicalFunction_productFunctionId" on "TechnicalFunction" ("productFunctionId");
create index if not exists "idx_UseCaseTechnicalFunction_useCaseId" on "UseCaseTechnicalFunction" ("useCaseId");
create index if not exists "idx_UseCaseTechnicalFunction_technicalFunctionId" on "UseCaseTechnicalFunction" ("technicalFunctionId");
