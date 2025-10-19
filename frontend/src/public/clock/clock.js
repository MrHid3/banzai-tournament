//przykład ciągnięcia zawodnika
const id = 15
fetch(`${backendURL}/getCompetitor/${id}?token=${token}`)

//ciągniesz zawodników z bazy
    //sprawdzasz czy mają tą samą kategorie
        //jeśli nie puszczasz alert i wywalone, to i tak sie nie powinno zdarzać
    //sprawdź czy ta walka już się nie wydarzyła
        //sprawdź historię walk obu zawodników
//kliknięcie na zegar lub spację puszcza czas
    //ustaw póki co na 3 minuty, jak będzie trzeba to zmienimy bo nie pamiętam ile chciał
    //tak samo kliknięcie lub spacja zatrzymuje
    //kiedy się kończy co dwie sekundy miga na czerwono (0:10 czerwono, 0:09 białe, 0:08 czerwono itd)
    //kiedy się w skończy miga szybciej
//kliknięcie na punkty zwiększa je
    //w prawym górnym rogu minusy które zmniejszają punkty
        //nie mogą zejść niżej niż zero itd
//kiedy czas stoi (skończył się lub zatrzymał ktoś) możesz z prawej wysunąc menu żeby wysłać
    //wybierasz kto wygrał, zanim się wyśle klikasz jeszcze potwierdzenie
    //wybierasz sposób wygranej z selecta: punkty, poddanie, walkover, decyzja sędziowska
    //wysyłasz wynik POSTem na /saveFightResult jako jsona:
            // {
            //     token: token
            //     winner_ID: ID zwyciężcy
            //     winner_points: liczba punktów zwyciężcy
            //     loser_ID: ID przegranego
            //     loser_points: liczba punktów przegranego
            //     category_ID: ID category
            //     reason: powód wygranej
            // }
//jak to wyślesz powinieneś móc zobaczyć wyniki walki na /getFightResults
//i wyniki walki pojedynczych zawodników na /getFightResults/id_zawodnika