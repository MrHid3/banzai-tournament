//to ci ciągnie numer stolika który ktoś wybrał i wywala do wyboru stolika jeżeli nie wybrał
const tableNumber = localStorage.getItem("tableNumber");
if(tableNumber == null){
    window.location.href="/wybierzStolik"
}

/*
w lewym górnym rogu ma się pokazywać numer stolika
     color: text-active, background-color: highlight, zaokrąglony prawy dolny róg
kiedy wchodzisz ciągniesz z backendu get
    GET /getGroups/?tableNumber=<numer stolika>&token=<token>
        to ci oddaje jedną lub dwie grupy (tylko jedną jeżeli już się kończy ta połowa turnieju)
    potem możesz te kategorie pociągnąć
        GET /getCategory/<id kategori>?token=<token>
        to ci zwraca id, imiona i nazwiska zawodników z tej kategorii

po lewej stronie strony, na tego danych które dostałeś tworzysz dla każdej grupy tabelke
    tabelka zawiera imię i nazwisko
        border-color: black, background-color: bg-secondary, color: text-inactive
        każdy rząd możesz klinkąć lub odkliknąć
            kliknięty: background-color: bg-primary, color: text-active
nad tabelkami masz przycisk ZAWOŁAJ
    color: text-active, background-color: highlight
    wysyła listę id zawodników, którzy nie są kliknięci (domyślnie nie są kliknięci)
        POST /callCompetitors {token: <token>, competitors: [<id pierwszego, id drugiego, ...>]}
            jeżeli zwrócony kod 200:
                komunikat sukcesu (zwykły div, nie alert) "Zawołanie wysłane"
                przycisk ZAWOŁAJ jest wyłączony na 30 sekund
            inaczej:
                komunikat błędu "Nie wysłano zawołania"
obok tabelki jest napisany poziom grupy

po prawej stronie strony tworzysz listę dla każdej grupy
możesz przełączyć między widokiem tabelki albo listy przełącznikiem nad listami
lista:
    każdy rząd to jedna walka w style [bob marley] [john cena]
    sprawdzasz czy już walczyli
        GET /getFightResults/<id pierwszego zawodnika>?token=<token>
            patrzysz czy w liście którą dostaniesz jest id drugiego zawodnika
        jeżeli nie
            color: bg-primary, background-color: bg-action
        jeżeli tak
            color: text-active, background-color: highlight
            jak klikniesz wyskakuje alert "Ta walka już się rozegrała. Czy na pewno chcesz ją powtórzyć?"
    po kliknięciu na rząd jesteś przeniesiony na /zegar?id=<id pierwszego>&id2=<id drugiego>
tabelka:
    tabela o wymiarach x + 1 * x + 1, gdzie x to liczba zawdoników w kategorii
    lewe górne pole puste
    w reszcie górnego rzędu i lewej kolumny komórki z imionami po kolej
        nazwiska pod imieniami
    pola
        sprawdzasz czy zawodnicy już walczyli
            GET /getFightResults/<id pierwszego zawodnika>?token=<token>
                patrzysz czy w liście którą dostaniesz jest id drugiego zawodnika
            jeżeli nie
                background-color: bg-action
            jeżeli tak
                background-color: highlight
                jak klikniesz wyskakuje alert "Ta walka już się rozegrała. Czy na pewno chcesz ją powtórzyć?"
            pola na skrzyżowaniu zawodnika samego ze sobą są wyiksowane i nie można ich kliknąć
    po kliknięciu na pole jesteś przeniesiony na /zegar?id=<id pierwszego>&id2=<id drugiego>

pod tabelkami/listami przycisk zakończ grupy
    pojawia się dopiero kiedy wszyskie walki się rozegrają
    background-color: highlight, color: text-active
    po kliknięciu
        dla każdej grupy wysyła request na serwer (czyli jeśli są dwie grupy wyśle dwa requesty)
            POST /endCategory {token: <token>, category_id: <id kategorii>}
        przeładowuję stronę, tak żeby zaczęły się kolejne kategorie
*/