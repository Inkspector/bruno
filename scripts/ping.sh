#!/usr/bin/env bash

# 1. Récupération et validation de l'argument IP
IP_ADDRESS="$1"

if [ -z "$IP_ADDRESS" ]; then
    echo "Erreur : Vous devez fournir une adresse IP en argument." >&2
    echo "Usage : $0 <adresse_IP>" >&2
    exit 1
fi

# 2. Gestion des variables d'environnement avec valeurs par défaut
COUNT="${PING_COUNT:-3}"
FORMAT="${RESPONSE_TYPE:-RAW}"

echo "count=$COUNT"
echo "createdMissionId=${createdMissionId}"

# Conversion en majuscules pour éviter les surprises de casse (raw -> RAW)
FORMAT=$(echo "$FORMAT" | tr '[:lower:]' '[:upper:]')

# 3. Exécution du ping
# On redirige la sortie standard et les erreurs selon le besoin
if [ "$FORMAT" = "JSON" ]; then
    # En mode JSON, on masque la sortie du ping pour ne garder que le statut
    ping -c "$COUNT" -t 1 "$IP_ADDRESS" > /dev/null 2>&1
    PING_STATUS=$?
else
    # En mode RAW, on laisse le ping afficher son résultat dans le terminal
    ping -c "$COUNT" -t 1 "$IP_ADDRESS"
    PING_STATUS=$?
fi

# 4. Formatage du résultat
if [ "$FORMAT" = "JSON" ]; then
    if [ $PING_STATUS -eq 0 ]; then
        REACHABLE="true"
    else
        REACHABLE="false"
    fi
    # Affichage du JSON
    echo "{\"ip\":\"$IP_ADDRESS\",\"reachable\":$REACHABLE}"
fi