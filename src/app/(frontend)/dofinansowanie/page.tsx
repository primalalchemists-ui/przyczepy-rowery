import Image from 'next/image'

import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Dofinansowanie',
}


export default function DofinansowaniePage() {
  return (
    <section className="mx-auto max-w-[1400px] px-4 py-8 space-y-10">
      {/* Logo / flaga u góry */}
      <div className="relative h-24 w-full max-w-[520px]">
        <Image
          src="/logo/logotyp-unia.png"
          alt="Fundusze Europejskie – NextGenerationEU"
          fill
          className="object-contain"
          priority
        />
      </div>

      {/* Treść */}
      <section className="space-y-6 text-sm leading-6 text-[hsl(30_20%_20%)]">
        <h1 className="text-2xl font-semibold">
          Informacja o dofinansowaniu projektu
        </h1>

        <p>
          <b>Przedsiębiorstwo Handlowo – Usługowe Agnieszka Sopolińska, Easy Apartments Wrocław</b>{' '}
          Agnieszka Sopolińska realizuje projekt pod tytułem:{' '}
          <b>
            „Rozwój zaplecza turystycznego w regionie Dolnośląskim poprzez zakup
            nowych środków trwałych”
          </b>
          , w ramach Krajowego Planu Odbudowy i Zwiększania Odporności, Działanie
          A1.2.1 – Inwestycje dla przedsiębiorstw w produkty, usługi i kompetencje
          pracowników oraz kadry związane z dywersyfikacją działalności.
        </p>

        <h2 className="text-lg font-semibold">Główne działania obejmują:</h2>
        <ul className="list-disc pl-6 space-y-2">
          <li>
            Inwestycje w środki trwałe – zakup przyczep kempingowych umożliwiających
            świadczenie mobilnych, krótkoterminowych usług zakwaterowania oraz zakup
            rowerów elektrycznych i roweru szosowego jako usług dodatkowych w ramach
            oferty turystycznej.
          </li>
          <li>
            Transformację cyfrową – wdrożenie aplikacji umożliwiającej prezentację
            dostępności usług oraz cyfrową obsługę klientów.
          </li>
          <li>
            Szkolenia personelu – podniesienie kompetencji pracowników w zakresie
            obsługi, bieżącej konserwacji oraz użytkowania przyczep kempingowych.
          </li>
          <li>
            Doradztwo w zakresie Gospodarki Obiegu Zamkniętego (GOZ) – przeprowadzenie
            audytu oraz opracowanie i wdrożenie wytycznych w zakresie ograniczania
            ilości odpadów oraz efektywnego wykorzystania zasobów.
          </li>
          <li>
            Zieloną transformację – wyposażenie przyczep kempingowych w instalacje
            fotowoltaiczne oraz zakup rowerów elektrycznych w celu ograniczenia emisji
            CO₂ i promowania odnawialnych źródeł energii.
          </li>
        </ul>

        <h2 className="text-lg font-semibold">Cele projektu:</h2>
        <p>
          Celem projektu jest dywersyfikacja działalności przedsiębiorstwa oraz
          zwiększenie jego odporności na zmiany rynkowe poprzez wprowadzenie nowej
          oferty mobilnych usług zakwaterowania oraz rozszerzenie oferty rekreacyjnej.
          Realizacja projektu umożliwi elastyczne dostosowanie usług do potrzeb rynku,
          cyfryzację procesu rezerwacji oraz wdrożenie rozwiązań proekologicznych
          zgodnych z zasadami zrównoważonego rozwoju.
        </p>

        <h2 className="text-lg font-semibold">Grupy docelowe:</h2>
        <p>
          Projekt skierowany jest do turystów i klientów indywidualnych poszukujących
          elastycznych form wypoczynku, w szczególności osób aktywnie spędzających czas,
          rodzin z dziećmi oraz klientów zainteresowanych wypoczynkiem blisko natury.
          Dodatkową grupą docelową są pracownicy przedsiębiorstwa, którzy dzięki
          szkoleniom podniosą swoje kompetencje zawodowe.
        </p>

        <h2 className="text-lg font-semibold">Efekty projektu:</h2>
        <ul className="list-disc pl-6 space-y-2">
          <li>
            Nowa oferta turystyczna – mobilne, krótkoterminowe usługi zakwaterowania
            dostępne w różnych lokalizacjach na terenie województwa dolnośląskiego.
          </li>
          <li>
            Podniesienie kompetencji pracowników – szkolenia z zakresu obsługi oraz
            bieżącej konserwacji przyczep kempingowych.
          </li>
          <li>
            Transformacja cyfrowa – wdrożenie aplikacji do rezerwacji umożliwiającej
            cyfrową obsługę klientów i zarządzanie dostępnością usług.
          </li>
          <li>
            Ekologiczne rozwiązania – wprowadzenie zasad Gospodarki Obiegu Zamkniętego
            (GOZ) oraz zastosowanie odnawialnych źródeł energii poprzez wyposażenie
            przyczep w instalacje fotowoltaiczne.
          </li>
          <li>
            Wzrost odporności rynkowej – dywersyfikacja działalności przedsiębiorstwa
            oraz zwiększenie odporności na zmiany rynkowe.
          </li>
        </ul>

        <p>
          <b>Wartość projektu:</b> 737 631,00 PLN <br />
          <b>Wysokość wkładu Funduszy Europejskich:</b> 389 999,36 PLN
        </p>

        <p className="text-xs opacity-70">
          #KorzyściDlaCiebie #NextGenerationEU #FunduszeUE
        </p>

        <hr className="opacity-30" />

        <p className="text-xs opacity-80">
          Przedsiębiorstwo Handlowo – Usługowe Agnieszka Sopolińska, Easy Apartments Wrocław
        </p>
      </section>
    </section>
  )
}
