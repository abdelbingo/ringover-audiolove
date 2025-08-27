const words = [
  { key: "copy", value: { en: "Copy", fr: "Copier", es: "Copiar" } },
  { key: "paste", value: { en: "Paste", fr: "Coller", es: "Pegar" } },
  { key: "cut", value: { en: "Cut", fr: "Couper", es: "Cortar" } },
  { key: "cancel", value: { en: "Cancel", fr: "Annuler", es: "Cancelar" } },
  { key: "format", value: { en: "Size", fr: "Taille", es: "Tamaño" } },
  { key: "small", value: { en: "Dialer", fr: "Dialeur", es: "Marcador" } },
  { key: "medium", value: { en: "Medium", fr: "Moyen écran", es: "Mediano" } },
  {
    key: "full_screen",
    value: { en: "Full Screen", fr: "Plein écran", es: "Pantalla completa" },
  },
  { key: "close", value: { en: "Quit", fr: "Quitter", es: "Salir" } },
  { key: "edit", value: { en: "Edit", fr: "Éditer", es: "Editar" } },
  { key: "view", value: { en: "View", fr: "Vue", es: "Visualización" } },
  { key: "reload", value: { en: "Reload", fr: "Recharger", es: "Recargar" } },
  { key: "center", value: { en: "Center", fr: "Centre", es: "Centrar" } },
  {
    key: "zoom_in",
    value: { en: "Zoom In", fr: "Agrandir", es: "Aumentar el zoom" },
  },
  {
    key: "zoom_out",
    value: { en: "Zoom Out", fr: "Diminuer", es: "Reducir el zoom" },
  },
  { key: "help", value: { en: "Help", fr: "Aide", es: "Ayuda" } },
  { key: "about", value: { en: "About", fr: "À propos de", es: "Acerca de" } },
  { key: "support", value: { en: "Support", fr: "Support", es: "Soporte" } },
  { key: "window", value: { en: "Window", fr: "Fenêtre", es: "Ventana" } },
  {
    key: "notification_title",
    value: {
      en: "Ringover Notification",
      fr: "Ringover Notification",
      es: "Ringover Notificación",
    },
  },
  {
    key: "notification_appel",
    value: { en: "Incoming call", fr: "Appel entrant", es: "Llamada entrante" },
  },
  {
    key: "notification_sms",
    value: { en: "New SMS", fr: "Nouveau SMS", es: "Nuevo SMS" },
  },
  {
    key: "notification_chat",
    value: {
      en: "New Chat Message",
      fr: "Nouveau Chat Message",
      es: "Nuevo Mensaje De Chat",
    },
  },
  {
    key: "notification_body_call",
    value: { en: "New Call :", fr: "Nouveau Appel :", es: "Nueva llamada :" },
  },
  {
    key: "notification_body_sms",
    value: { en: "New SMS", fr: "Nouveau SMS", es: "Nuevo SMS" },
  },
  {
    key: "notification_body_chat",
    value: {
      en: "New Chat Message : ",
      fr: "Nouveau Message Chat : ",
      es: "Mensaje de chat nuevo : ",
    },
  },
  {
    key: "minimize",
    value: { en: "Minimize", fr: "Minimiser", es: "Minimizar" },
  },
  { key: "zoom", value: { en: "Zoom", fr: "Zoom", es: "Zoom" } }, // Note: You had 'minimizar' here in the second table, which might be a mistake
  {
    key: "all_window_front",
    value: {
      en: "Bring All to Front",
      fr: "Tout ramener au premier plan",
      es: "Traer todo al frente",
    },
  },
  { key: "open", value: { en: "Open", fr: "Ouvrir", es: "Abrir" } },
  {
    key: "selectAll",
    value: {
      en: "Select All",
      fr: "Tout Sélectionner",
      es: "Seleccionar Todo",
    },
  },
  { key: "delete", value: { en: "Delete", fr: "Supprimer", es: "Eliminar" } },
  { key: "from", value: { en: "From", fr: "De ", es: "De" } },
  { key: "getto", value: { en: "Go to", fr: "Accéder à ", es: "Acceder a" } },
  { key: "call", value: { en: "Call", fr: "Appels", es: "Liamadas" } },
  { key: "chat", value: { en: "Chat", fr: "Chat", es: "Chat" } },
  { key: "sms", value: { en: "Sms", fr: "Sms", es: "Sms" } },
  {
    key: "settings",
    value: { en: "Settings", fr: "Paramètres", es: "Configuración" },
  },
  {
    key: "contacts",
    value: { en: "Contacts", fr: "Contacts", es: "Contactos" },
  },
  {
    key: "check_for_update",
    value: {
      en: "Check for Update",
      fr: "Vérification de mise à jour",
      es: "Comprobación de actualización",
    },
  },
  {
    key: "clear_cache_and_restart",
    value: {
      en: "Clear cache and restart",
      fr: "Effacer le cache et redémarrer",
      es: "Borrar caché y reiniciar",
    },
  },
  {
    key: "update_is_ok",
    value: {
      en: "Ringover is up to date",
      fr: "Ringover est à jour",
      es: "Ringover está actualizado",
    },
  },
  {
    key: "upgrade",
    value: { en: "Upgrade", fr: "Mettre à jour", es: "Actualizar" },
  },
  {
    key: "not_upgrade",
    value: { en: "Not now", fr: "Pas maintenant", es: "Ahora no" },
  },
  {
    key: "new_version",
    value: {
      en: "A new update is already available",
      fr: "Une nouvelle mise à jour est déjà disponible",
      es: "Una nueva actualización ya está disponible",
    },
  },
  {
    key: "new_version_help",
    value: {
      en: "You can update Ringover via the help menu",
      fr: "Vous pouvez mettre à jour Ringover via le menu aide",
      es: "Puedes actualizar Ringover a través del menú de ayuda",
    },
  },
  {
    key: "auto_launch",
    value: {
      en: "Open on system login",
      fr: "Ouvrir au démarrage",
      es: "Abrir al iniciar PC",
    },
  },
  {
    key: "pin_to_top",
    value: { en: "Pin to top", fr: "Epingler", es: "Anclar" },
  },
  {
    key: "hide_menu_bar",
    value: { en: "Hide menu ", fr: "Masquer le menu", es: "Ocultar el menú" },
  },
  {
    key: "show_menu_bar",
    value: { en: "Show menu ", fr: "Afficher le menu", es: "Mostrar menú" },
  },
  {
    key: "relaunch",
    value: { en: "Restart", fr: "Redémarrer", es: "Reiniciar" },
  },
  {
    key: "open_link_with",
    value: {
      en: "Open links with",
      fr: "Ouvrir les liens avec",
      es: "Abrir enlaces con",
    },
  },
  {
    key: "browser",
    value: { en: "Browser", fr: "Navigateur", es: "Navegador" },
  },
  {
    key: "settings_desktop",
    value: {
      en: "App settings",
      fr: "App Paramètres",
      es: "Ajustes de la aplicación",
    },
  },
  {
    key: "cpu_notify",
    value: {
      en: "Cpu notification",
      fr: "Cpu notification",
      es: "Activar las notificaciones del procesador Cpu",
    },
  },
  {
    key: "cpu_alert",
    value: { en: "Warning", fr: "Attention", es: "Advertencia" },
  },
  {
    key: "cpu_display_text_part1",
    value: {
      en: "Your processor (CPU) has reached the value of ",
      fr: "Votre processeur (CPU) a atteint la valeur de ",
      es: "u procesador (CPU) ha alcanzado el valor de ",
    },
  },
  {
    key: "cpu_display_text_part2",
    value: {
      en: ". For an optimal use of Ringover we recommend not to exceed 70% of CPU consumption. Quit the applications that are not used to reduce this consumption ",
      fr: ". Pour une utilisation optimale de Ringover nous préconisions de ne pas dépasser 70% de consommation du processeur. Quittez les applications qui ne sont pas utilisées pour réduire cette consommation",
      es: " . Para lograr un uso óptimo de Ringover, te recomendamos que no excedas el 70% de uso de la CPU. Cierra las aplicaciones que no estás utilizando para reducir este consumo",
    },
  },
];

module.exports = words;
