# Utenanlandsreisende backend-jobbing

- Får inn
  - Bruker
  - Landkoder,
  - Tidsrom

- For innsendt skjema
  # INNMELDING
  - Når tidsrom-start er nådd
    - Hent alle regiongruppene, finn de som tilsvarer landkoder
    - For hver regiongruppe som er aktuell
      - Sjekk om brukeren allerede er medlem
      - Hvis ikke medlem:
        - Legg til i gruppa
      # Dette kan vi alltid gjøre - dersom en bruker har bedt om pålogging fra denne regionen i det tidsrommet, skal den jo få det
  
  # UTMELDING
  - Når tidsrom-slutt er nådd
    # Her må muligens da sjekke om brukeren har FLERE innmeldte skjema til samme region som den kan meldes ut av - deretter sjekke om vi kan melde den ut på dette tidspunktet...
    - Dersom skjemadatene blir liggende i blob frem til utmeldingen har skjedd, så har vi disse dataene.

    - Hent alle andre innsendte skjema, tilsvarende det skjemaet vi er på (VFK-142)
    - Filtrer på alle som har samme object-id som current entra-object id
    - Sjekk om brukeren har overlappende tidsrom i samme region-gruppe
    - Om tidsrom i en av de overlappende innmeldte skjemaene til samme region har slutt-dato senere enn den vi er på:
      - Ikke meld ut brukeren, men fullfør current job

# Kødne caser
- Bruker sender inn flere skjema, der den skal til samme region - og tidsrommet er overlappende.

- 