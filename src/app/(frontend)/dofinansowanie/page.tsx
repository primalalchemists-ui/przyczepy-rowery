import Image from 'next/image'

export default function DofinansowaniePage() {
  return (
    <main className="mx-auto max-w-[1400px] px-4 py-8 space-y-10">
      {/* Logo */}
      <div className="relative h-20 w-[320px]">
        <Image
          src="/logo/Logotyp_unia.avif"
          alt="Fundusze Europejskie – NextGenerationEU"
          fill
          className="object-contain"
        />
      </div>

      {/* Treść */}
      <section className="space-y-6 text-sm leading-6 text-[hsl(30_20%_20%)]">
        <h1 className="text-2xl font-semibold">
          Informacja o dofinansowaniu projektu
        </h1>

        <p>
          MAT S.C. realizuje projekt pn.{' '}
          <b>
            „Rozwój Regionu – śląskie dzięki inwestycji w nowy sprzęt”
          </b>
          , w ramach Krajowego Planu Odbudowy i Zwiększania Odporności,
          Działanie A1.2.1 – Inwestycje dla przedsiębiorstw w produkty,
          usługi i kompetencje pracowników oraz kadry związane z
          dywersyfikacją działalności.
        </p>

        <h2 className="text-lg font-semibold">Główne działania obejmują:</h2>
        <ul className="list-disc pl-6 space-y-2">
          <li>
            Inwestycje w środki trwałe – zakup czterech przyczep kempingowych
            oraz zakup wyposażenia siłowni zewnętrznej.
          </li>
          <li>
            Cyfryzację – wdrożenie narzędzia do śledzenia dostępności rezerwacji.
          </li>
          <li>
            Szkolenia personelu – szkolenie w zakresie użytkowania i konserwacji
            przyczep kempingowych.
          </li>
          <li>
            Doradztwo GOZ – audyt i wdrożenie strategii ograniczania odpadów.
          </li>
          <li>
            Zieloną transformację – instalacje fotowoltaiczne w przyczepach,
            ograniczenie emisji CO₂.
          </li>
        </ul>

        <h2 className="text-lg font-semibold">Cele projektu</h2>
        <p>
          Dywersyfikacja działalności firmy poprzez wprowadzenie usług
          turystycznych, zwiększenie konkurencyjności oraz ograniczenie
          negatywnego wpływu na środowisko.
        </p>

        <h2 className="text-lg font-semibold">Grupy docelowe</h2>
        <p>
          Oferta skierowana jest do klientów indywidualnych, firm oraz pracowników
          przedsiębiorstwa zdobywających nowe kompetencje.
        </p>

        <h2 className="text-lg font-semibold">Efekty projektu</h2>
        <ul className="list-disc pl-6 space-y-2">
          <li>Nowa oferta usługowa – krótkoterminowe zakwaterowanie.</li>
          <li>Podniesienie kompetencji personelu.</li>
          <li>Transformacja cyfrowa – system rezerwacji.</li>
          <li>Zielona transformacja – OZE i GOZ.</li>
          <li>Wzrost odporności rynkowej firmy.</li>
        </ul>

        <p>
          <b>Wartość projektu:</b> 600 000,00 PLN <br />
          <b>Wysokość wkładu Funduszy Europejskich:</b> 479 940,00 PLN
        </p>

        <p className="text-xs opacity-70">
          #KorzyściDlaCiebie #NextGenerationEU #FunduszeUE
        </p>
      </section>
    </main>
  )
}
