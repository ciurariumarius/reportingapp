import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Politica de confidentialitate | DigitalDot Reports",
  description:
    "Politica de confidentialitate pentru aplicatia de raportare DigitalDot Reports."
};

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-white">
      <article className="mx-auto max-w-3xl px-5 py-12 text-slate-700">
        <p className="text-sm font-semibold uppercase tracking-wide text-digital">
          DigitalDot Reports
        </p>
        <h1 className="mt-3 text-3xl font-semibold text-slate-950">
          Politica de confidentialitate
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          Ultima actualizare: 8 iulie 2026
        </p>

        <section className="mt-8 space-y-3">
          <h2 className="text-xl font-semibold text-slate-950">1. Cine suntem</h2>
          <p>
            DigitalDot Reports este o aplicatie privata de raportare folosita pentru
            centralizarea datelor de marketing din Google Ads, Google Analytics 4 si
            Meta Ads. Aplicatia este administrata de agentia sau operatorul care v-a
            oferit acces la raport.
          </p>
        </section>

        <section className="mt-8 space-y-3">
          <h2 className="text-xl font-semibold text-slate-950">
            2. Ce date prelucram
          </h2>
          <p>
            Aplicatia poate prelucra date agregate si operationale despre campanii,
            cum ar fi nume si ID-uri de campanii, cheltuieli, afisari, reach,
            clickuri, conversii, actiuni, venituri raportate si indicatori de
            performanta. Pentru conturile Meta Ads, aceste date sunt citite prin Meta
            Marketing API numai pentru ad account-urile la care operatorul are acces.
          </p>
          <p>
            Aplicatia mai poate salva date de configurare pentru clienti, precum nume
            client, slug, moneda, limba raportului, website, logo si linkuri de surse
            de date.
          </p>
        </section>

        <section className="mt-8 space-y-3">
          <h2 className="text-xl font-semibold text-slate-950">
            3. Scopul prelucrarii
          </h2>
          <p>
            Folosim aceste date pentru a genera rapoarte de performanta, pentru a
            monitoriza campanii, pentru a verifica functionalitatea integrarilor si
            pentru a proteja accesul la zona de administrare si la rapoartele private.
          </p>
        </section>

        <section className="mt-8 space-y-3">
          <h2 className="text-xl font-semibold text-slate-950">
            4. Temeiul si accesul la date
          </h2>
          <p>
            Prelucrarea se face in baza contractului, a interesului legitim de a
            furniza servicii de raportare si, unde este necesar, in baza acordului
            acordat de client pentru conectarea conturilor de publicitate si analytics.
            Datele sunt accesibile doar persoanelor autorizate de operator si de
            client.
          </p>
        </section>

        <section className="mt-8 space-y-3">
          <h2 className="text-xl font-semibold text-slate-950">
            5. Partajarea datelor
          </h2>
          <p>
            Nu vindem date personale. Datele pot fi procesate de furnizori tehnici
            necesari pentru gazduire, baza de date, securitate, mentenanta si servicii
            API, in limitele necesare functionarii aplicatiei.
          </p>
        </section>

        <section className="mt-8 space-y-3">
          <h2 className="text-xl font-semibold text-slate-950">
            6. Stocare si securitate
          </h2>
          <p>
            Pastram datele cat timp este necesar pentru furnizarea serviciului sau
            conform obligatiilor contractuale si legale. Credentialele API sunt
            stocate server-side si sunt protejate prin controale de acces; valorile
            secrete nu sunt afisate in interfata publica.
          </p>
        </section>

        <section className="mt-8 space-y-3">
          <h2 className="text-xl font-semibold text-slate-950">
            7. Drepturile persoanelor vizate
          </h2>
          <p>
            In functie de legislatia aplicabila, puteti solicita acces, rectificare,
            stergere, restrictionare, opozitie sau portabilitatea datelor. De asemenea,
            puteti depune o plangere la Autoritatea Nationala de Supraveghere a
            Prelucrarii Datelor cu Caracter Personal.
          </p>
        </section>

        <section className="mt-8 space-y-3">
          <h2 className="text-xl font-semibold text-slate-950">
            8. Stergerea datelor Meta
          </h2>
          <p>
            Pentru stergerea datelor asociate cu integrarea Meta Ads sau pentru
            revocarea accesului, contactati agentia sau operatorul care v-a oferit
            acces la aplicatie. Operatorul poate elimina datele salvate si poate revoca
            tokenurile sau permisiunile din Meta Business Settings.
          </p>
        </section>

        <section className="mt-8 space-y-3">
          <h2 className="text-xl font-semibold text-slate-950">9. Contact</h2>
          <p>
            Pentru intrebari despre aceasta politica, folositi adresa de contact din
            contractul sau comunicarea primita de la agentia care administreaza
            instanta aplicatiei.
          </p>
        </section>
      </article>
    </main>
  );
}
