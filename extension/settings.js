/* Ajustes por defecto, compartidos por el service worker, el script de contenido y el popup */
var KCX_DEFAULTS = {
  enabled: true,                       // interruptor general
  paints: true,                        // pinturas de nombre
  badges: true,                        // insignias de rango
  animations: true,                    // animaciones de las pinturas
  shadows: true,                       // sombras de las pinturas
  skipPainted: true,                   // no pintar el nombre si otra extensión (7TV) ya lo hizo
  debug: false,
  supabaseUrl: "https://nlgkpoomhgehuabrkwhp.supabase.co",
  anonKey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5sZ2twb29taGdlaHVhYnJrd2hwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE3NjE3NzAsImV4cCI6MjEwNzMzNzc3MH0.DM1cUzclLbu8ej8m7PAQEja6X20gBadNiuqMEzbk-_g",                    // clave pública (anon): solo lectura por RLS
  siteUrl: "https://presentescoci.vercel.app/"
};
