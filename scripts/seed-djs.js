
const { initializeApp, getApps, getApp } = require("firebase/app")
const { getFirestore } = require("firebase/firestore")
const { collection, addDoc, serverTimestamp, query, where, getDocs } = require("firebase/firestore")

const firebaseConfig = {
  apiKey: "AIzaSyBzSPow2dSdqKOX79Vi7VvsZXg_M8lc730",
  authDomain: "event-ticket-website-6b541.firebaseapp.com",
  databaseURL: "https://event-ticket-website-6b541-default-rtdb.firebaseio.com",
  projectId: "event-ticket-website-6b541",
  storageBucket: "event-ticket-website-6b541.firebasestorage.app",
  messagingSenderId: "423743096823",
  appId: "1:423743096823:web:6d6366b1df73f954a1d0f2",
  measurementId: "G-KLMK6Q830S"
}

// Initialize Firebase
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig)
const db = getFirestore(app)

const djs = [
  {
    name: "David Guetta",
    performerType: "Person",
    instagramHandle: "davidguetta",
    country: "Francia",
    imageUrl: "https://www.rollingstone.com/wp-content/uploads/2023/10/david-guetta-press-photo-credit-dan-carabas.jpg",
    spotifyUrl: "https://open.spotify.com/artist/1Cs0zKBU1kc0i8ypK3B9ai",
    soundcloudUrl: "https://soundcloud.com/davidguetta",
    bio: "Pierre David Guetta es un DJ y productor francés, considerado uno de los artistas de música electrónica más exitosos de todos los tiempos. Con más de 50 millones de discos vendidos, ha sido una figura clave en la fusión del dance con la música pop, colaborando con estrellas mundiales. Ha ganado dos premios Grammy y ha sido nombrado DJ #1 del mundo en múltiples ocasiones.",
    description: "El ícono global de la música, David Guetta, está listo para hacer vibrar al público con sus éxitos atemporales que han dominado las listas de popularidad. Desde \"Titanium\" hasta \"I'm Good (Blue)\", prepárate para una noche de energía inigualable y melodías que han definido a una generación.",
    genres: ["House", "Pop", "Electronic", "Dance-pop"],
    alternateName: "Pierre David Guetta",
    birthDate: "1967-11-07",
    jobTitle: ["DJ", "Productor Musical", "Compositor"],
    famousTracks: [
      { name: "Titanium (feat. Sia)" },
      { name: "When Love Takes Over (feat. Kelly Rowland)" },
      { name: "I'm Good (Blue) (with Bebe Rexha)" },
      { name: "Sexy Bitch (feat. Akon)" }
    ],
    famousAlbums: [
      { name: "One Love (2009)" },
      { name: "Nothing but the Beat (2011)" },
      { name: "7 (2018)" }
    ],
    wikipediaUrl: "https://es.wikipedia.org/wiki/David_Guetta",
    officialWebsite: "https://davidguetta.com/",
    facebookUrl: "https://www.facebook.com/DavidGuetta",
    twitterUrl: "https://twitter.com/davidguetta"
  },
  {
    name: "Martin Garrix",
    performerType: "Person",
    instagramHandle: "martingarrix",
    country: "Países Bajos",
    imageUrl: "https://weraveyou.com/wp-content/uploads/2023/02/Martin-Garrix-press-2023-1.jpg",
    spotifyUrl: "https://open.spotify.com/artist/60d24wfXkVzDSfLS6hyCjZ",
    soundcloudUrl: "https://soundcloud.com/martingarrix",
    bio: "Martijn Gerard Garritsen, conocido mundialmente como Martin Garrix, es un DJ y productor neerlandés. Fundador del sello STMPD RCRDS, saltó a la fama en 2013 con su sencillo \"Animals\". Ha sido clasificado como el DJ número uno del mundo por DJ Mag en múltiples ocasiones, reconocido por sus producciones innovadoras y sus enérgicas presentaciones.",
    description: "Prepárate para una noche inolvidable con la superestrella mundial, Martin Garrix. Conocido por sus himnos icónicos como \"Animals\", \"In the Name of Love\" y \"Scared to Be Lonely\", Garrix ofrece un espectáculo audiovisual de alta energía que ha cautivado a millones.",
    genres: ["Progressive House", "House", "Pop", "Electronic"],
    alternateName: "Martijn Gerard Garritsen",
    birthDate: "1996-05-14",
    jobTitle: ["DJ", "Productor Musical", "Compositor"],
    famousTracks: [
      { name: "Animals" },
      { name: "In the Name of Love (feat. Bebe Rexha)" },
      { name: "Scared to Be Lonely (feat. Dua Lipa)" },
      { name: "High On Life (feat. Bonn)" }
    ],
    famousAlbums: [
      { name: "Sentio (2022)" },
      { name: "Seven (EP, 2016)" }
    ],
    wikipediaUrl: "https://es.wikipedia.org/wiki/Martin_Garrix",
    officialWebsite: "https://martingarrix.com/",
    facebookUrl: "https://www.facebook.com/martin.garrix",
    twitterUrl: "https://twitter.com/martingarrix"
  },
  {
    name: "Alok",
    performerType: "Person",
    instagramHandle: "alok",
    country: "Brasil",
    imageUrl: "https://www.billboard.com/wp-content/uploads/2023/05/alok-cr-gil-inoue-2022-billboard-1548.jpg",
    spotifyUrl: "https://open.spotify.com/artist/0NGAZxHanS9e0iNHpR8f2W",
    soundcloudUrl: "https://soundcloud.com/livealok",
    bio: "Alok Achkar Peres Petrillo es un DJ y productor brasileño, uno de los mayores exponentes de la escena electrónica en Sudamérica. Su estilo, a menudo denominado \"Brazilian Bass\", le ha ganado reconocimiento internacional, especialmente con su éxito \"Hear Me Now\".",
    description: "¡Siente el ritmo de Brasil con Alok! El pionero del \"Brazilian Bass\" trae una energía contagiosa a cada uno de sus sets, fusionando melodías emotivas con bajos potentes que te harán bailar toda la noche.",
    genres: ["House", "Bass House", "Electronic", "Pop"],
    alternateName: "Alok Achkar Peres Petrillo",
    birthDate: "1991-08-26",
    jobTitle: ["DJ", "Productor Musical"],
    famousTracks: [
      { name: "Hear Me Now" },
      { name: "Don't Say Goodbye" },
      { name: "Deep Down" },
      { name: "On & On" }
    ],
    wikipediaUrl: "https://es.wikipedia.org/wiki/Alok",
    officialWebsite: "https://alokmusic.com/",
    facebookUrl: "https://www.facebook.com/livealok",
    twitterUrl: "https://twitter.com/alokoficial"
  },
  {
    name: "Dimitri Vegas & Like Mike",
    performerType: "MusicGroup",
    instagramHandle: "dimitrivegasandlikemike",
    country: "Bélgica",
    imageUrl: "https://weraveyou.com/wp-content/uploads/2022/07/Dimitri-Vegas-Like-Mike-press-2022.jpg",
    spotifyUrl: "https://open.spotify.com/artist/73jBynjsVtocto11jLyW9D",
    soundcloudUrl: "https://soundcloud.com/dimitrivegasandlikemike",
    bio: "Dimitri Vegas & Like Mike es un dúo belga de DJs compuesto por los hermanos Dimitri y Michael Thivaios. Son conocidos por sus enérgicas actuaciones y su papel como embajadores del festival Tomorrowland. Han sido votados como los DJ #1 del mundo en múltiples ocasiones.",
    description: "¡El dúo más explosivo de la escena electrónica está aquí! Dimitri Vegas & Like Mike traen su característico sonido Big Room y una energía arrolladora que ha conquistado los escenarios más grandes del mundo.",
    genres: ["Big Room", "Electro House", "House"],
    members: [
      { name: "Dimitri Thivaios", role: "DJ", alternateName: "Dimitri Thivaios" },
      { name: "Michael Thivaios", role: "DJ", alternateName: "Michael Thivaios" }
    ],
    famousTracks: [
      { name: "The Hum" },
      { name: "Tremor (con Martin Garrix)" },
      { name: "Mammoth" },
      { name: "Instagram (con David Guetta)" }
    ],
    wikipediaUrl: "https://es.wikipedia.org/wiki/Dimitri_Vegas_%26_Like_Mike",
    officialWebsite: "https://www.dimitrivegasandlikemike.com/",
    facebookUrl: "https://www.facebook.com/dimitrivegasandlikemike",
    twitterUrl: "https://twitter.com/dimitrivegas"
  },
  {
    name: "Armin van Buuren",
    performerType: "Person",
    instagramHandle: "arminvanbuuren",
    country: "Países Bajos",
    imageUrl: "https://edmlab.de/wp-content/uploads/2022/04/Armin-van-Buuren.jpg",
    spotifyUrl: "https://open.spotify.com/artist/1rS4GPddsfdt2WEi0sMMn4",
    soundcloudUrl: "https://soundcloud.com/arminvanbuuren",
    bio: "Armin van Buuren es un DJ y productor neerlandés, una de las figuras más influyentes en la música Trance. Es conocido por su programa de radio semanal \"A State of Trance\" (ASOT), con millones de oyentes en todo el mundo. Ha sido nombrado DJ número uno del mundo en cinco ocasiones.",
    description: "El rey del Trance, Armin van Buuren, te llevará a un viaje musical inolvidable. Con sus melodías eufóricas y su energía inigualable, cada set es una experiencia trascendental.",
    genres: ["Trance", "Progressive Trance", "House"],
    alternateName: "Armin Jozef Jacobus Daniël van Buuren",
    birthDate: "1976-12-25",
    jobTitle: ["DJ", "Productor Musical", "Compositor"],
    famousTracks: [
      { name: "This Is What It Feels Like" },
      { name: "Blah Blah Blah" },
      { name: "In and Out of Love" },
      { name: "Great Spirit" }
    ],
    famousAlbums: [
      { name: "Imagine (2008)" },
      { name: "Mirage (2010)" },
      { name: "Intense (2013)" }
    ],
    wikipediaUrl: "https://es.wikipedia.org/wiki/Armin_van_Buuren",
    officialWebsite: "https://www.arminvanbuuren.com/",
    facebookUrl: "https://www.facebook.com/arminvanbuuren",
    twitterUrl: "https://twitter.com/arminvanbuuren"
  },
  {
    name: "Timmy Trumpet",
    performerType: "Person",
    instagramHandle: "timmytrumpet",
    country: "Australia",
    imageUrl: "https://e00-marca.uecdn.es/assets/multimedia/imagenes/2022/09/29/16644686032128.jpg",
    spotifyUrl: "https://open.spotify.com/artist/0CbeG1224FS58zV6G2xfPT",
    soundcloudUrl: "https://soundcloud.com/timmytrumpet",
    bio: "Timothy Jude Smith es un músico, DJ y productor australiano. Es mundialmente conocido por incorporar una trompeta en vivo en sus sets de DJ, creando un espectáculo enérgico y único. Su éxito \"Freaks\" lo catapultó a la fama internacional.",
    description: "¡Prepárate para la locura con Timmy Trumpet! Este showman australiano combina la energía del EDM con el poder de su trompeta en vivo, creando una fiesta como ninguna otra.",
    genres: ["Hardstyle", "House", "Psytrance", "Electronic"],
    alternateName: "Timothy Jude Smith",
    birthDate: "1982-06-09",
    jobTitle: ["DJ", "Productor Musical", "Músico"],
    famousTracks: [
      { name: "Freaks (con Savage)" },
      { name: "Narco (con Blasterjaxx)" },
      { name: "Oracle" },
      { name: "Party Till We Die" }
    ],
    famousAlbums: [
      { name: "Mad World (2020)" }
    ],
    wikipediaUrl: "https://en.wikipedia.org/wiki/Timmy_Trumpet",
    officialWebsite: "https://www.timmytrumpet.com/",
    facebookUrl: "https://www.facebook.com/timmytrumpet",
    twitterUrl: "https://twitter.com/timmytrumpet"
  },
  {
    name: "Peggy Gou",
    performerType: "Person",
    instagramHandle: "peggygou_",
    country: "Corea del Sur",
    imageUrl: "https://geo-media.beatport.com/image/abf6020d-82d1-4435-86f7-b5074e2d365f.jpg",
    spotifyUrl: "https://open.spotify.com/artist/1Cs0zKBU1kc0i8ypK3B9ai5",
    soundcloudUrl: "https://soundcloud.com/peggygou",
    bio: "Kim Min-ji, conocida como Peggy Gou, es una DJ, productora y diseñadora de moda surcoreana residente en Berlín. Se ha convertido en un ícono global, famosa por su ecléctica selección musical que fusiona house y techno con influencias disco y un estilo inconfundible. Su éxito \"(It Goes Like) Nanana\" la consolidó como una estrella mainstream.",
    description: "La sensación internacional Peggy Gou trae su estilo único y sofisticado a la pista de baile. Prepárate para un set ecléctico que viaja desde el house más vibrante hasta el techno hipnótico, todo con una energía contagiosa.",
    genres: ["House", "Techno", "Deep House", "Electronic"],
    alternateName: "Kim Min-ji",
    birthDate: "1991-07-03",
    jobTitle: ["DJ", "Productora Musical", "Diseñadora de moda"],
    famousTracks: [
      { name: "(It Goes Like) Nanana" },
      { name: "Starry Night" },
      { name: "I Go" },
      { name: "1+1=11" }
    ],
    famousAlbums: [
      { name: "I Hear You (2024)" }
    ],
    wikipediaUrl: "https://es.wikipedia.org/wiki/Peggy_Gou",
    officialWebsite: "https://peggygou.com/",
    facebookUrl: "https://www.facebook.com/peggygoupeggygou",
    twitterUrl: "https://twitter.com/peggygou_"
  },
  {
    name: "Steve Aoki",
    performerType: "Person",
    instagramHandle: "steveaoki",
    country: "Estados Unidos",
    imageUrl: "https://www.youredm.com/wp-content/uploads/2022/10/steve-aoki-press-2022-credit-Sam-Spratt-scaled.jpg",
    spotifyUrl: "https://open.spotify.com/artist/77AiFEVeAVj2ORpC85QVJs",
    soundcloudUrl: "https://soundcloud.com/steveaoki",
    bio: "Steven Hiroyuki Aoki es un DJ y productor estadounidense de electro house. Es conocido por sus enérgicas actuaciones que a menudo incluyen acrobacias y el famoso lanzamiento de pasteles al público. Es el fundador del influyente sello discográfico Dim Mak Records.",
    description: "¡La fiesta más salvaje del EDM llega con Steve Aoki! Conocido por sus sets explosivos y el icónico \"caking\", Aoki garantiza un espectáculo lleno de energía, sorpresas y, por supuesto, ¡mucho pastel!",
    genres: ["Electro House", "EDM", "Pop", "Trap"],
    alternateName: "Steven Hiroyuki Aoki",
    birthDate: "1977-11-30",
    jobTitle: ["DJ", "Productor Musical"],
    famousTracks: [
      { name: "Boneless" },
      { name: "Pursuit of Happiness (Remix)" },
      { name: "Just Hold On" },
      { name: "Waste It On Me (feat. BTS)" }
    ],
    famousAlbums: [
      { name: "Wonderland (2012)" },
      { name: "Neon Future I (2014)" },
      { name: "HiROQUEST: Genesis (2022)" }
    ],
    wikipediaUrl: "https://es.wikipedia.org/wiki/Steve_Aoki",
    officialWebsite: "https://steveaoki.com/",
    facebookUrl: "https://www.facebook.com/steveaoki",
    twitterUrl: "https://twitter.com/steveaoki"
  },
  {
    name: "FISHER",
    performerType: "Person",
    instagramHandle: "followthefishtv",
    country: "Australia",
    imageUrl: "https://weraveyou.com/wp-content/uploads/2023/12/FISHER-Press-Shot.jpg",
    spotifyUrl: "https://open.spotify.com/artist/1VJ0briNOlXRtJUAevxmih",
    soundcloudUrl: "https://soundcloud.com/fish-fisher",
    bio: "Paul Nicholas Fisher es un DJ y productor australiano. Ex surfista profesional, FISHER se ha convertido en una de las figuras más carismáticas de la música house y tech house, conocido por su energía desbordante y sus producciones virales. Su éxito mundial \"Losing It\" le valió una nominación al Grammy.",
    description: "¡El fenómeno australiano FISHER está listo para hacerte perder la cabeza! Con su energía contagiosa y sus himnos de tech house como \"Losing It\" y \"You Little Beauty\", cada set es una fiesta garantizada.",
    genres: ["Tech House", "House"],
    alternateName: "Paul Nicholas Fisher",
    birthDate: "1986-11-05",
    jobTitle: ["DJ", "Productor Musical"],
    famousTracks: [
      { name: "Losing It" },
      { name: "You Little Beauty" },
      { name: "Just Feels Tight" },
      { name: "Take It Off (con AATIG)" }
    ],
    wikipediaUrl: "https://es.wikipedia.org/wiki/Fisher_(DJ)",
    officialWebsite: "https://followthefish.tv/",
    facebookUrl: "https://www.facebook.com/Followthefishtv",
    twitterUrl: "https://twitter.com/followthefishtv"
  },
  {
    name: "Afrojack",
    performerType: "Person",
    instagramHandle: "afrojack",
    country: "Países Bajos",
    imageUrl: "https://weraveyou.com/wp-content/uploads/2021/10/Afrojack-press-2021.jpg",
    spotifyUrl: "https://open.spotify.com/artist/4D75GcNG95ebPtNvoElPzn",
    soundcloudUrl: "https://soundcloud.com/afrojack",
    bio: "Nick van de Wall, conocido como Afrojack, es un DJ y productor neerlandés ganador de un Grammy. Es una figura clave en la escena del \"Dutch House\" y ha colaborado con grandes artistas pop. Es el fundador del sello discográfico Wall Recordings.",
    description: "El gigante del Dutch House, Afrojack, llega para dominar la pista de baile con sus ritmos potentes y su sonido inconfundible. Ganador de un Grammy y colaborador de superestrellas, su set es una garantía de calidad y energía.",
    genres: ["Dutch House", "Electro House", "House"],
    alternateName: "Nick van de Wall",
    birthDate: "1987-09-09",
    jobTitle: ["DJ", "Productor Musical", "Remixer"],
    famousTracks: [
      { name: "Take Over Control" },
      { name: "Give Me Everything (con Pitbull)" },
      { name: "Ten Feet Tall" },
      { name: "Hey Mama (con David Guetta)" }
    ],
    famousAlbums: [
      { name: "Forget the World (2014)" }
    ],
    wikipediaUrl: "https://es.wikipedia.org/wiki/Afrojack",
    officialWebsite: "https://afrojack.com/",
    facebookUrl: "https://www.facebook.com/djafrojack",
    twitterUrl: "https://twitter.com/afrojack"
  },
  {
    name: "Don Diablo",
    performerType: "Person",
    instagramHandle: "dondiablo",
    country: "Países Bajos",
    imageUrl: "https://weraveyou.com/wp-content/uploads/2022/01/Don-Diablo-Press-pic.jpg",
    spotifyUrl: "https://open.spotify.com/artist/1l2ekx5skC4gJH8djERwh1",
    soundcloudUrl: "https://soundcloud.com/dondiablo",
    bio: "Don Pepijn Schipper es un DJ y productor neerlandés, considerado uno de los pioneros del género Future House. Fundador del sello HEXAGON, Don Diablo es conocido por su sonido innovador, sus visuales futuristas y su fuerte conexión con su comunidad de fans, los \"Hexagonians\".",
    description: "¡El maestro del Future House, Don Diablo, aterriza con su sonido vanguardista! Prepárate para un viaje musical al futuro con melodías innovadoras y una energía que te hará bailar sin parar.",
    genres: ["Future House", "House", "Electronic"],
    alternateName: "Don Pepijn Schipper",
    birthDate: "1980-02-27",
    jobTitle: ["DJ", "Productor Musical", "Compositor"],
    famousTracks: [
      { name: "Cutting Shapes" },
      { name: "On My Mind" },
      { name: "Momentum" },
      { name: "Survive" }
    ],
    famousAlbums: [
      { name: "Future (2018)" },
      { name: "Forever (2021)" }
    ],
    wikipediaUrl: "https://es.wikipedia.org/wiki/Don_Diablo_(DJ)",
    officialWebsite: "https://dondiablo.com/",
    facebookUrl: "https://www.facebook.com/OfficialDonDiablo",
    twitterUrl: "https://twitter.com/dondiablo"
  },
  {
    name: "R3HAB",
    performerType: "Person",
    instagramHandle: "r3hab",
    country: "Países Bajos",
    imageUrl: "https://edm.com/.image/ar_1:1%2Cc_fill%2Ccs_srgb%2Cfl_progressive%2Cq_auto:good%2Cw_1200/MTk2NTE1MTU2NTQ2NTI5NTM5/r3hab.jpg",
    spotifyUrl: "https://open.spotify.com/artist/1Cs0zKBU1kc0i8ypK3B9ai6",
    soundcloudUrl: "https://soundcloud.com/r3hab",
    bio: "Fadil El Ghoul, conocido como R3HAB, es un DJ y productor neerlandés-marroquí. Es uno de los artistas más prolíficos de la escena, conocido por sus innumerables remixes y colaboraciones que abarcan géneros desde el Big Room hasta el pop y el slap house. Es el fundador del sello CYB3RPVNK.",
    description: "Con un arsenal de éxitos y remixes que han conquistado las radios y festivales de todo el mundo, R3HAB ofrece un set dinámico y lleno de energía que no da respiro.",
    genres: ["Electro House", "Slap House", "Pop", "House"],
    alternateName: "Fadil El Ghoul",
    birthDate: "1986-04-02",
    jobTitle: ["DJ", "Productor Musical", "Remixer"],
    famousTracks: [
      { name: "All Around The World (La La La)" },
      { name: "Lullaby (con Mike Williams)" },
      { name: "Flames (con ZAYN & Jungleboi)" },
      { name: "Karate (con KSHMR)" }
    ],
    famousAlbums: [
      { name: "Trouble (2017)" },
      { name: "The Wave (2018)" }
    ],
    wikipediaUrl: "https://es.wikipedia.org/wiki/R3hab",
    officialWebsite: "https://www.r3hab.com/",
    facebookUrl: "https://www.facebook.com/r3hab",
    twitterUrl: "https://twitter.com/r3hab"
  },
  {
    name: "KSHMR",
    performerType: "Person",
    instagramHandle: "kshmr",
    country: "Estados Unidos",
    imageUrl: "https://weraveyou.com/wp-content/uploads/2021/05/KSHMR-Press-Pic.jpeg",
    spotifyUrl: "https://open.spotify.com/artist/2wX6xSig4Rig5kZU6ePlWe",
    soundcloudUrl: "https://soundcloud.com/kshmr",
    bio: "Niles Hollowell-Dhar, conocido como KSHMR, es un DJ y productor estadounidense. Famoso por su proyecto The Cataracs, adoptó el alias KSHMR para explorar un sonido que fusiona Big Room con influencias de sus raíces indias, creando una experiencia musical cinematográfica y narrativa.",
    description: "KSHMR te transporta a un mundo de sonidos exóticos y ritmos épicos. Su fusión única de EDM con influencias de la India crea una experiencia cinematográfica y llena de energía que no te puedes perder.",
    genres: ["Big Room", "Progressive House", "Electro House"],
    alternateName: "Niles Hollowell-Dhar",
    birthDate: "1988-10-06",
    jobTitle: ["DJ", "Productor Musical", "Compositor"],
    famousTracks: [
      { name: "Secrets (con Tiësto)" },
      { name: "Megalodon" },
      { name: "Karate (con R3hab)" },
      { name: "Like a G6 (con The Cataracs)" }
    ],
    famousAlbums: [
      { name: "Harmonica Andromeda (2021)" }
    ],
    wikipediaUrl: "https://es.wikipedia.org/wiki/KSHMR",
    officialWebsite: "https://welcometokshmr.com/",
    facebookUrl: "https://www.facebook.com/KSHMRmusic",
    twitterUrl: "https://twitter.com/KSHMRmusic"
  },
  {
    name: "W&W",
    performerType: "MusicGroup",
    instagramHandle: "wandwmusic",
    country: "Países Bajos",
    imageUrl: "https://edm.com/.image/ar_1.91:1%2Cc_fill%2Ccs_srgb%2Cfl_progressive%2Cg_faces:center%2Cq_auto:good%2Cw_1200/MTY4MDAwMTY5NDI3OTQ4OTQ2/ww.jpg",
    spotifyUrl: "https://open.spotify.com/artist/1Cs0zKBU1kc0i8ypK3B9ai7",
    soundcloudUrl: "https://soundcloud.com/wandw",
    bio: "W&W es un dúo neerlandés de DJs y productores compuesto por Willem van Hanegem y Ward van der Harst. Son conocidos por su sonido que fusiona Trance, Electro House y Big Room, creando himnos para festivales. También tienen un proyecto paralelo de Trance llamado NWYR.",
    description: "¡Prepárate para el caos sónico de W&W! El dúo neerlandés es famoso por sus sets de alta energía que combinan lo mejor del Big Room, Trance y Hardstyle para una experiencia de festival inolvidable.",
    genres: ["Big Room", "Trance", "Electro House", "Hardstyle"],
    members: [
      { name: "Willem van Hanegem", role: "DJ", alternateName: "Willem van Hanegem" },
      { name: "Ward van der Harst", role: "DJ", alternateName: "Ward van der Harst" }
    ],
    famousTracks: [
      { name: "Bigfoot" },
      { name: "The Code (con Hardwell)" },
      { name: "Rave Culture" },
      { name: "God Is A Girl" }
    ],
    wikipediaUrl: "https://es.wikipedia.org/wiki/W%26W",
    officialWebsite: "https://www.wandwmusic.com/",
    facebookUrl: "https://www.facebook.com/wandwmusic",
    twitterUrl: "https://twitter.com/wandwmusic"
  },
  {
    name: "Lost Frequencies",
    performerType: "Person",
    instagramHandle: "lostfrequencies",
    country: "Bélgica",
    imageUrl: "https://weraveyou.com/wp-content/uploads/2022/10/Lost-Frequencies-Press-1.jpg",
    spotifyUrl: "https://open.spotify.com/artist/1Cs0zKBU1kc0i8ypK3B9ai8",
    soundcloudUrl: "https://soundcloud.com/lostfrequencies",
    bio: "Felix De Laet, conocido como Lost Frequencies, es un DJ y productor belga. Saltó a la fama mundial con su remix de \"Are You with Me\" en 2014. Su estilo se caracteriza por melodías profundas y pegadizas dentro del deep house y el tropical house, logrando un gran éxito comercial y de crítica.",
    description: "Déjate llevar por las melodías contagiosas de Lost Frequencies. El productor belga trae su sonido característico de deep house y tropical vibes, perfecto para crear una atmósfera inolvidable.",
    genres: ["Deep House", "Tropical House", "Electronic", "Pop"],
    alternateName: "Felix De Laet",
    birthDate: "1993-11-30",
    jobTitle: ["DJ", "Productor Musical"],
    famousTracks: [
      { name: "Are You with Me" },
      { name: "Reality (feat. Janieck Devy)" },
      { name: "Where Are You Now (con Calum Scott)" },
      { name: "The Feeling" }
    ],
    famousAlbums: [
      { name: "Less Is More (2016)" },
      { name: "All Stand Together (2023)" }
    ],
    wikipediaUrl: "https://es.wikipedia.org/wiki/Lost_Frequencies",
    officialWebsite: "https://lostfrequencies.com/",
    facebookUrl: "https://www.facebook.com/LostFrequenciesMusic",
    twitterUrl: "https://twitter.com/LFrequencies"
  },
  {
    name: "Calvin Harris",
    performerType: "Person",
    instagramHandle: "calvinharris",
    country: "Reino Unido",
    imageUrl: "https://i0.wp.com/dancingastronaut.com/wp-content/uploads/2023/07/calvin-harris-creamfields.jpg",
    spotifyUrl: "https://open.spotify.com/artist/1Cs0zKBU1kc0i8ypK3B9ai9",
    soundcloudUrl: "https://soundcloud.com/calvinharris",
    bio: "Adam Richard Wiles, conocido como Calvin Harris, es un DJ, productor, cantante y compositor escocés. Es una de las figuras más exitosas de la música dance, conocido por su habilidad para crear éxitos mundiales que fusionan la electrónica con el pop. Ganador de múltiples premios Grammy, ha encabezado los festivales más grandes del mundo.",
    description: "El creador de éxitos #1, Calvin Harris, trae su legendario catálogo a la pista de baile. Desde himnos de festival como \"Summer\" hasta clásicos del pop como \"One Kiss\", su set es una clase magistral de energía y melodías universalmente aclamadas.",
    genres: ["Pop", "House", "Electronic", "Funk", "Dance-pop"],
    alternateName: "Adam Richard Wiles",
    birthDate: "1984-01-17",
    jobTitle: ["DJ", "Productor Musical", "Compositor", "Cantante"],
    famousTracks: [
      { name: "Summer" },
      { name: "Feel So Close" },
      { name: "One Kiss (con Dua Lipa)" },
      { name: "We Found Love (con Rihanna)" }
    ],
    famousAlbums: [
      { name: "18 Months (2012)" },
      { name: "Motion (2014)" },
      { name: "Funk Wav Bounces Vol. 1 (2017)" }
    ],
    wikipediaUrl: "https://es.wikipedia.org/wiki/Calvin_Harris",
    officialWebsite: "https://calvinharris.com/",
    facebookUrl: "https://www.facebook.com/calvinharris",
    twitterUrl: "https://twitter.com/CalvinHarris"
  },
  {
    name: "Oliver Heldens",
    performerType: "Person",
    instagramHandle: "oliverheldens",
    country: "Países Bajos",
    imageUrl: "https://weraveyou.com/wp-content/uploads/2023/11/Oliver-Heldens-press-2023.jpg",
    spotifyUrl: "https://open.spotify.com/artist/5nki7yD3r",
    soundcloudUrl: "https://soundcloud.com/oliverheldens",
    bio: "Olivier Heldens es un DJ y productor neerlandés, figura clave en la popularización del Future House. También produce bass house y tech house bajo su alias HI-LO. Es el fundador del sello Heldeep Records y es conocido por su sonido groovy y enérgico.",
    description: "Oliver Heldens trae los ritmos más frescos de la escena house. Con su sonido único que combina elementos de future house y deep house, es imposible no contagiarse de su buena vibra en la pista de baile.",
    genres: ["Future House", "Deep House", "Tech House"],
    alternateName: "Olivier J. L. Heldens",
    birthDate: "1995-02-01",
    jobTitle: ["DJ", "Productor Musical"],
    famousTracks: [
      { name: "Gecko (Overdrive)" },
      { name: "Koala" },
      { name: "Turn Me On (con Riton)" },
      { name: "Last All Night (Koala)" }
    ],
    wikipediaUrl: "https://es.wikipedia.org/wiki/Oliver_Heldens",
    officialWebsite: "https://oliverheldens.com/",
    facebookUrl: "https://www.facebook.com/OliverHeldens",
    twitterUrl: "https://twitter.com/oliverheldens"
  },
  {
    name: "Charlotte de Witte",
    performerType: "Person",
    instagramHandle: "charlottedewittemusic",
    country: "Bélgica",
    imageUrl: "https://d3g9pb5wu2sslg.cloudfront.net/post-media/113-charlotte-de-witte-2.jpg",
    spotifyUrl: "https://open.spotify.com/artist/1lAbPAi5FvnMcnSgT3tWnC",
    soundcloudUrl: "https://soundcloud.com/charlottedewittemusic",
    bio: "Charlotte de Witte es una DJ y productora belga, una de las figuras más prominentes del techno a nivel mundial. Es conocida por su estilo oscuro, potente y sin concesiones. Es fundadora del sello KNTXT y se ha consolidado como la reina indiscutible de la escena techno actual.",
    description: "Adéntrate en la oscuridad con la reina del techno, Charlotte de Witte. Sus sets potentes y hipnóticos son un viaje sonoro implacable que te llevará a otra dimensión. Una experiencia obligada para los verdaderos amantes del techno.",
    genres: ["Techno", "Acid Techno", "Minimal Techno"],
    alternateName: "Charlotte de Witte",
    birthDate: "1992-07-21",
    jobTitle: ["DJ", "Productora Musical"],
    famousTracks: [
      { name: "The Age of Love (Remix)" },
      { name: "Sgadi Li Mi" },
      { name: "Doppler" },
      { name: "Selected" }
    ],
    famousAlbums: [
      { name: "Rave on Time (EP)" },
      { name: "Apollo (EP)" },
      { name: "Formula (EP)" }
    ],
    wikipediaUrl: "https://en.wikipedia.org/wiki/Charlotte_de_Witte",
    officialWebsite: "https://www.charlottedewittemusic.com/",
    facebookUrl: "https://www.facebook.com/charlottedewittemusic",
    twitterUrl: "https://twitter.com/charlottedwitte"
  },
  {
    name: "Fedde Le Grand",
    performerType: "Person",
    instagramHandle: "feddelegrand",
    country: "Países Bajos",
    imageUrl: "https://www.edmfever.com/wp-content/uploads/2021/08/Fedde-Le-Grand.jpeg",
    spotifyUrl: "https://open.spotify.com/artist/0NGAZxHanS9e0iNHpR8f2W0",
    soundcloudUrl: "https://soundcloud.com/feddelegrand",
    bio: "Fedde Le Grand es un DJ y productor neerlandés, considerado una leyenda del house. Saltó a la fama mundial en 2006 con el icónico \"Put Your Hands Up 4 Detroit\". Es conocido por su habilidad para mezclar y su influencia duradera en la música house, manteniendo su relevancia a lo largo de los años.",
    description: "Una leyenda del house toma el escenario. Fedde Le Grand es sinónimo de maestría en la cabina, ofreciendo sets que combinan clásicos atemporales con los sonidos más frescos del house, siempre con una energía impecable.",
    genres: ["House", "Progressive House", "Electro House"],
    alternateName: "Fedde Le Grand",
    birthDate: "1977-09-07",
    jobTitle: ["DJ", "Productor Musical", "Remixer"],
    famousTracks: [
      { name: "Put Your Hands Up 4 Detroit" },
      { name: "Let Me Think About It (vs. Ida Corr)" },
      { name: "So Much Love" },
      { name: "The Creeps (Remix)" }
    ],
    famousAlbums: [
      { name: "Output (2009)" },
      { name: "Something Real (2016)" }
    ],
    wikipediaUrl: "https://es.wikipedia.org/wiki/Fedde_Le_Grand",
    officialWebsite: "https://feddelegrand.com/",
    facebookUrl: "https://www.facebook.com/feddelegrand",
    twitterUrl: "https://twitter.com/feddelegrand"
  },
  {
    name: "Vintage Culture",
    performerType: "Person",
    instagramHandle: "vintageculture",
    country: "Brasil",
    imageUrl: "https://weraveyou.com/wp-content/uploads/2022/10/Vintage-Culture-Press-2.jpg",
    spotifyUrl: "https://open.spotify.com/artist/0NGAZxHanS9e0iNHpR8f2W1",
    soundcloudUrl: "https://soundcloud.com/vintageculturemusic",
    bio: "Lukas Hespanhol Ruiz, conocido como Vintage Culture, es un DJ y productor brasileño. Se ha convertido en una de las mayores fuerzas del house y melodic house a nivel mundial, conocido por sus sets emotivos y sus producciones de alta calidad. Es un habitual en los sellos más prestigiosos y en los escenarios principales de festivales.",
    description: "Sumérgete en el viaje sonoro de Vintage Culture. El maestro brasileño del melodic house te guiará a través de un set lleno de emociones, melodías cautivadoras y un groove irresistible que ha conquistado al mundo entero.",
    genres: ["House", "Melodic House", "Tech House"],
    alternateName: "Lukas Hespanhol Ruiz",
    birthDate: "1993-07-07",
    jobTitle: ["DJ", "Productor Musical"],
    famousTracks: [
      { name: "It Is What It Is (feat. Elise LeGrow)" },
      { name: "Cali Dreams" },
      { name: "I Will Find" },
      { name: "You Give Me A Feeling (con James Hype)" }
    ],
    famousAlbums: [
      { name: "Promised Land (2024)" }
    ],
    wikipediaUrl: "https://en.wikipedia.org/wiki/Vintage_Culture_(DJ)",
    officialWebsite: "https://vintageculture.com/",
    facebookUrl: "https://www.facebook.com/vintageculturemusic",
    twitterUrl: "https://twitter.com/vintageculture"
  },
  {
    name: "Alan Walker",
    performerType: "Person",
    instagramHandle: "alanwalkermusic",
    country: "Noruega",
    imageUrl: "https://weraveyou.com/wp-content/uploads/2023/10/Alan-Walker-Press-2023.jpg",
    spotifyUrl: "https://open.spotify.com/artist/0NGAZxHanS9e0iNHpR8f2W2",
    soundcloudUrl: "https://soundcloud.com/alanwalker",
    bio: "Alan Olav Walker es un DJ y productor noruego-británico. Se convirtió en un fenómeno mundial con su sencillo \"Faded\" en 2015. Su estilo melódico y emotivo, junto con su icónica imagen enmascarada, le ha ganado una base de fans masiva en todo el mundo, acumulando miles de millones de reproducciones.",
    description: "El enigmático Alan Walker trae su universo musical al escenario. Conocido por éxitos virales como \"Faded\" y \"Alone\", su show es una experiencia audiovisual completa, llena de melodías épicas y un ambiente de unidad.",
    genres: ["Electronic", "Pop", "House", "Electro House"],
    alternateName: "Alan Olav Walker",
    birthDate: "1997-08-24",
    jobTitle: ["DJ", "Productor Musical"],
    famousTracks: [
      { name: "Faded" },
      { name: "Alone" },
      { name: "The Spectre" },
      { name: "On My Way" }
    ],
    famousAlbums: [
      { name: "Different World (2018)" },
      { name: "World of Walker (2021)" }
    ],
    wikipediaUrl: "https://es.wikipedia.org/wiki/Alan_Walker",
    officialWebsite: "https://alanwalker.com/",
    facebookUrl: "https://www.facebook.com/alanwalkermusic",
    twitterUrl: "https://twitter.com/IAmAlanWalker"
  },
  {
    name: "Skrillex",
    performerType: "Person",
    instagramHandle: "skrillex",
    country: "Estados Unidos",
    imageUrl: "https://geo-media.beatport.com/image/57601951-6d9b-4395-8e42-7901168f15e8.jpg",
    spotifyUrl: "https://open.spotify.com/artist/0NGAZxHanS9e0iNHpR8f2W3",
    soundcloudUrl: "https://soundcloud.com/skrillex",
    bio: "Sonny John Moore, conocido como Skrillex, es un productor, DJ y cantante estadounidense. Es una de las figuras más influyentes de la música electrónica moderna, pionero en popularizar el género Dubstep en Estados Unidos. Ganador de 9 premios Grammy, su sonido innovador y disruptivo ha cambiado el panorama de la música dance.",
    description: "El pionero sónico, Skrillex, está listo para desatar un set impredecible y lleno de energía. Desde el dubstep que lo hizo famoso hasta sus colaboraciones más recientes que rompen géneros, espera lo inesperado de uno de los artistas más innovadores de la electrónica.",
    genres: ["Dubstep", "Trap", "Electronic", "Pop"],
    alternateName: "Sonny John Moore",
    birthDate: "1988-01-15",
    jobTitle: ["DJ", "Productor Musical", "Compositor", "Cantante"],
    famousTracks: [
      { name: "Scary Monsters and Nice Sprites" },
      { name: "Bangarang" },
      { name: "Where Are Ü Now (con Jack Ü y Justin Bieber)" },
      { name: "Rumble (con Fred again.. & Flowdan)" }
    ],
    famousAlbums: [
      { name: "Recess (2014)" },
      { name: "Quest for Fire (2023)" },
      { name: "Don't Get Too Close (2023)" }
    ],
    wikipediaUrl: "https://es.wikipedia.org/wiki/Skrillex",
    officialWebsite: "https://skrillex.com/",
    facebookUrl: "https://www.facebook.com/skrillex",
    twitterUrl: "https://twitter.com/Skrillex"
  },
  {
    name: "Hardwell",
    performerType: "Person",
    instagramHandle: "hardwell",
    country: "Países Bajos",
    imageUrl: "https://www.edmtunes.com/wp-content/uploads/2022/03/Hardwell-Ultra-2022-Rukes-1-scaled-e1648439972322.jpg",
    spotifyUrl: "https://open.spotify.com/artist/6BrvowZBreEkXzJQMpL174",
    soundcloudUrl: "https://soundcloud.com/hardwell",
    bio: "Robbert van de Corput, conocido como Hardwell, es un DJ y productor neerlandés. Votado DJ #1 del mundo en 2013 y 2014, es una figura central del Big Room y Progressive House. Fundador del influyente sello Revealed Recordings, es conocido por su enérgico sonido y sus aclamados sets.",
    description: "¡El rey del Big Room está aquí! Hardwell está listo para hacer temblar la tierra con sus bajos potentes y sus melodías épicas. Después de un regreso triunfal, sus shows son una demostración de poder y energía de principio a fin.",
    genres: ["Big Room", "Progressive House", "Electro House", "Techno"],
    alternateName: "Robbert van de Corput",
    birthDate: "1988-01-07",
    jobTitle: ["DJ", "Productor Musical"],
    famousTracks: [
      { name: "Spaceman" },
      { name: "Apollo (feat. Amba Shepherd)" },
      { name: "Young Again" },
      { name: "Bella Ciao (Remix)" }
    ],
    famousAlbums: [
      { name: "United We Are (2015)" },
      { name: "Rebels Never Die (2022)" }
    ],
    wikipediaUrl: "https://es.wikipedia.org/wiki/Hardwell",
    officialWebsite: "https://djhardwell.com/",
    facebookUrl: "https://www.facebook.com/djhardwell",
    twitterUrl: "https://twitter.com/hardwell"
  },
  {
    name: "The Chainsmokers",
    performerType: "MusicGroup",
    instagramHandle: "thechainsmokers",
    country: "Estados Unidos",
    imageUrl: "https://weraveyou.com/wp-content/uploads/2022/05/The-Chainsmokers-Press-2022.jpg",
    spotifyUrl: "https://open.spotify.com/artist/0NGAZxHanS9e0iNHpR8f2W4",
    soundcloudUrl: "https://soundcloud.com/thechainsmokers",
    bio: "The Chainsmokers es un dúo de productores y DJs estadounidenses compuesto por Alexander \"Alex\" Pall y Andrew \"Drew\" Taggart. Alcanzaron la fama mundial con un sonido que fusiona pop, indie y música electrónica, creando algunos de los mayores éxitos de la última década como \"Closer\" y \"Don't Let Me Down\".",
    description: "¡El dúo que rompió las barreras entre el pop y la electrónica! The Chainsmokers ofrecen un show lleno de himnos que todos pueden cantar, combinando la energía de un festival con la emoción de un concierto en vivo.",
    genres: ["Pop", "EDM", "Future Bass", "Electronic"],
    members: [
      { name: "Alex Pall", role: "DJ", alternateName: "Alex Pall" },
      { name: "Drew Taggart", role: "DJ", alternateName: "Drew Taggart" }
    ],
    famousTracks: [
      { name: "Closer (feat. Halsey)" },
      { name: "Don't Let Me Down (feat. Daya)" },
      { name: "Something Just Like This (con Coldplay)" },
      { name: "Paris" }
    ],
    famousAlbums: [
      { name: "Memories...Do Not Open (2017)" },
      { name: "Sick Boy (2018)" },
      { name: "So Far So Good (2022)" }
    ],
    wikipediaUrl: "https://es.wikipedia.org/wiki/The_Chainsmokers",
    officialWebsite: "https://www.thechainsmokers.com/",
    facebookUrl: "https://www.facebook.com/thechainsmokers",
    twitterUrl: "https://twitter.com/TheChainsmokers"
  },
  {
    name: "Tiësto",
    performerType: "Person",
    instagramHandle: "tiesto",
    country: "Países Bajos",
    imageUrl: "https://weraveyou.com/wp-content/uploads/2023/11/Tiesto-Press-2023-2.jpg",
    spotifyUrl: "https://open.spotify.com/artist/0NGAZxHanS9e0iNHpR8f2W5",
    soundcloudUrl: "https://soundcloud.com/tiesto",
    bio: "Tijs Michiel Verwest, conocido como Tiësto, es un DJ y productor neerlandés, a menudo llamado \"El Padrino del EDM\". Es una leyenda viviente que ha evolucionado desde sus raíces en el trance hasta convertirse en un ícono global del pop y el house, manteniendo una relevancia inigualable por más de dos décadas.",
    description: "La leyenda viviente, Tiësto, trae su inigualable experiencia a la cabina. Con un repertorio que abarca desde clásicos del trance hasta los mayores éxitos del dance-pop actual, su set es un viaje a través de la historia de la música electrónica.",
    genres: ["House", "Pop", "Trance", "Electronic"],
    alternateName: "Tijs Michiel Verwest",
    birthDate: "1969-01-17",
    jobTitle: ["DJ", "Productor Musical"],
    famousTracks: [
      { name: "Adagio for Strings" },
      { name: "The Business" },
      { name: "Red Lights" },
      { name: "Secrets (con KSHMR)" }
    ],
    famousAlbums: [
      { name: "In Search of Sunrise (Series)" },
      { name: "Just Be (2004)" },
      { name: "Drive (2023)" }
    ],
    wikipediaUrl: "https://es.wikipedia.org/wiki/Ti%C3%ABsto",
    officialWebsite: "https://www.tiesto.com/",
    facebookUrl: "https://www.facebook.com/tiesto",
    twitterUrl: "https://twitter.com/tiesto"
  },
  {
    name: "Carl Cox",
    performerType: "Person",
    instagramHandle: "carlcoxofficial",
    country: "Reino Unido",
    imageUrl: "https://www.plasticosydecibelios.com/wp-content/uploads/2021/08/carl-cox-press-photo.jpg",
    spotifyUrl: "https://open.spotify.com/artist/0NGAZxHanS9e0iNHpR8f2W6",
    soundcloudUrl: "https://soundcloud.com/carl-cox",
    bio: "Carl Cox es un DJ y productor británico, una de las figuras más queridas y respetadas en la historia de la música techno y house. Su sonrisa contagiosa, su técnica impecable (a menudo usando tres o más platos) y su energía inagotable lo han convertido en un embajador global de la música electrónica por más de 30 años.",
    description: "\"Oh yes, oh yes!\" El legendario Carl Cox está en la casa. Prepárate para una clase magistral de techno y house de uno de los DJs más icónicos del planeta. Su energía y pasión son incomparables.",
    genres: ["Techno", "House", "Tech House"],
    alternateName: "Carl Cox",
    birthDate: "1962-07-29",
    jobTitle: ["DJ", "Productor Musical"],
    famousTracks: [
      { name: "I Want You (Forever)" },
      { name: "Dr. Funk" },
      { name: "The Player" },
      { name: "See You Again" }
    ],
    famousAlbums: [
      { name: "F.A.C.T. (1995)" },
      { name: "All Roads Lead to the Dancefloor (2011)" },
      { name: "Electronic Generations (2022)" }
    ],
    wikipediaUrl: "https://es.wikipedia.org/wiki/Carl_Cox",
    officialWebsite: "https://carlcox.com/",
    facebookUrl: "https://www.facebook.com/carlcox247",
    twitterUrl: "https://twitter.com/Carl_Cox"
  },
  {
    name: "Gordo",
    performerType: "Person",
    instagramHandle: "gordoszn",
    country: "Estados Unidos",
    imageUrl: "https://edm.com/.image/ar_1:1%2Cc_fill%2Cs_srgb%2Cfl_progressive%2Cq_auto:good%2Cw_1200/MTk1OTYyMTU5MzA5OTY3NDY0/gordo.jpg",
    spotifyUrl: "https://open.spotify.com/artist/0NGAZxHanS9e0iNHpR8f2W7",
    soundcloudUrl: "https://soundcloud.com/gordoszn",
    bio: "Diamanté Anthony Blackmon, anteriormente conocido como Carnage y ahora como Gordo, es un DJ y productor guatemalteco-estadounidense. Tras una exitosa carrera en el trap y el hardstyle, reinventó su sonido con el alias Gordo, enfocándose en el tech house, house y techno con influencias latinas, consolidándose rápidamente en la escena underground.",
    description: "El sonido inconfundible de Gordo llega para tomar el control. El alias de tech house de Diamanté Blackmon trae ritmos hipnóticos, bajos potentes y una energía underground que hará vibrar la pista de baile.",
    genres: ["Tech House", "House", "Techno"],
    alternateName: "Diamanté Anthony Blackmon",
    birthDate: "1991-01-03",
    jobTitle: ["DJ", "Productor Musical"],
    famousTracks: [
      { name: "Hombres y Mujeres (con FEID)" },
      { name: "Rizzla" },
      { name: "TARAKA" },
      { name: "Leaving Earth (feat. KAS:ST)" }
    ],
    wikipediaUrl: "https://en.wikipedia.org/wiki/Gordo_(DJ)",
    officialWebsite: "https://www.gordoszn.com/",
    facebookUrl: "https://www.facebook.com/Gordoszn",
    twitterUrl: "https://twitter.com/gordoszn"
  },
  {
    name: "Nicky Romero",
    performerType: "Person",
    instagramHandle: "nickyromero",
    country: "Países Bajos",
    imageUrl: "https://weraveyou.com/wp-content/uploads/2023/12/Nicky-Romero-press-2023-scaled.jpg",
    spotifyUrl: "https://open.spotify.com/artist/0NGAZxHanS9e0iNHpR8f2W8",
    soundcloudUrl: "https://soundcloud.com/nickyromero",
    bio: "Nick Rotteveel, conocido como Nicky Romero, es un DJ y productor neerlandés. Es una figura prominente en la escena del Progressive House y fundador del influyente sello Protocol Recordings. Es conocido por éxitos como \"Toulouse\" y su colaboración con Avicii, \"I Could Be the One\".",
    description: "El maestro del progressive house, Nicky Romero, trae sus melodías eufóricas y su energía de festival al escenario. Fundador de Protocol Recordings, su set es una garantía de producciones de alta calidad y momentos inolvidables.",
    genres: ["Progressive House", "Electro House", "House"],
    alternateName: "Nick Rotteveel",
    birthDate: "1989-01-06",
    jobTitle: ["DJ", "Productor Musical"],
    famousTracks: [
      { name: "Toulouse" },
      { name: "I Could Be the One (con Avicii)" },
      { name: "Legacy (con Krewella)" },
      { name: "Like Home (con NERVO)" }
    ],
    wikipediaUrl: "https://es.wikipedia.org/wiki/Nicky_Romero",
    officialWebsite: "https://nickyromero.com/",
    facebookUrl: "https://www.facebook.com/djnickyromero",
    twitterUrl: "https://twitter.com/nickyromero"
  },
  {
    name: "Reinier Zonneveld",
    performerType: "Person",
    instagramHandle: "reinierzonneveld",
    country: "Países Bajos",
    imageUrl: "https://thumbnailer.mixcloud.com/unsafe/1200x628/profile/7/7/4/1/1a2c-9a4f-4d6f-993d-d558b2959666.jpg",
    spotifyUrl: "https://open.spotify.com/artist/0NGAZxHanS9e0iNHpR8f2W9",
    soundcloudUrl: "https://soundcloud.com/reinier-zonneveld",
    bio: "Reinier Zonneveld es un DJ y productor neerlandés, conocido por sus maratónicos sets de techno en vivo. Su estilo combina el acid techno con potentes líneas de bajo y melodías intrincadas, todo improvisado en tiempo real. Es el fundador del sello Filth on Acid y una de las figuras más respetadas del techno moderno.",
    description: "Prepárate para un maratón de techno con el maestro de los sets en vivo, Reinier Zonneveld. Su habilidad para improvisar en directo crea una experiencia única y contundente, llena de acid y energía pura.",
    genres: ["Techno", "Acid Techno"],
    alternateName: "Reinier Zonneveld",
    birthDate: "1991-01-30",
    jobTitle: ["DJ", "Productor Musical"],
    famousTracks: [
      { name: "Things We Might Have Said" },
      { name: "Hard Gaan" },
      { name: "Move Your Body To The Beat" },
      { name: "Rave Dan" }
    ],
    famousAlbums: [
      { name: "Megacity Servant (2016)" },
      { name: "Church of Clubmusic (2019)" },
      { name: "Heaven Is Mad (For You) (2023)" }
    ],
    wikipediaUrl: "https://en.wikipedia.org/wiki/Reinier_Zonneveld",
    officialWebsite: "https://reinierzonneveld.com/",
    facebookUrl: "https://www.facebook.com/ReinierZonneveld",
    twitterUrl: "https://twitter.com/reinierzonneveld"
  },
  {
    name: "Vini Vici",
    performerType: "MusicGroup",
    instagramHandle: "vinivicimusic",
    country: "Israel",
    imageUrl: "https://weraveyou.com/wp-content/uploads/2019/07/vini-vici.jpg",
    spotifyUrl: "https://open.spotify.com/artist/73jBynjsVtocto11jLyW9D0",
    soundcloudUrl: "https://soundcloud.com/vinivicimusic",
    bio: "Vini Vici es un dúo israelí de psytrance compuesto por Aviram Saharai y Matan Kadosh. Son considerados los embajadores del psytrance en la escena EDM global, responsables de llevar el género a los escenarios principales de los festivales más grandes del mundo con su sonido potente, tribal y melódico.",
    description: "Entra en trance con la energía psicodélica de Vini Vici. El dúo israelí que conquistó el mundo del EDM trae su característico sonido psytrance para una experiencia de alta intensidad que te llevará a otra dimensión.",
    genres: ["Psytrance", "Trance"],
    members: [
      { name: "Aviram Saharai", role: "DJ", alternateName: "Aviram Saharai" },
      { name: "Matan Kadosh", role: "DJ", alternateName: "Matan Kadosh" }
    ],
    famousTracks: [
      { name: "Great Spirit (vs. Armin van Buuren)" },
      { name: "The Tribe" },
      { name: "Free Tibet (Vini Vici Remix)" },
      { name: "Adhana (vs. Astrix)" }
    ],
    famousAlbums: [
      { name: "Future Classics (2015)" }
    ],
    wikipediaUrl: "https://en.wikipedia.org/wiki/Vini_Vici_(DJs)",
    officialWebsite: "https://vinivicimusic.com/",
    facebookUrl: "https://www.facebook.com/ViniViciMusic",
    twitterUrl: "https://twitter.com/vinivicimusic"
  },
  {
    name: "Claptone",
    performerType: "Person",
    instagramHandle: "claptone.official",
    country: "Alemania",
    imageUrl: "https://weraveyou.com/wp-content/uploads/2021/07/Claptone.jpg",
    spotifyUrl: "https://open.spotify.com/artist/73jBynjsVtocto11jLyW9D1",
    soundcloudUrl: "https://soundcloud.com/claptone",
    bio: "Claptone es un enigmático DJ y productor alemán, reconocible por su icónica máscara de pico dorado de la Comedia del arte. Su sonido, que fusiona deep house con melodías soul y vocales emotivas, lo ha convertido en una figura venerada en la escena house global. Es el anfitrión de los aclamados eventos \"The Masquerade\".",
    description: "Entra en el mundo místico de Claptone. El enigmático hombre de la máscara dorada te guiará a través de un set mágico de house y deep house, lleno de melodías encantadoras y un groove irresistible.",
    genres: ["House", "Deep House", "Tech House"],
    alternateName: "(Desconocido)",
    birthDate: "(Desconocido)",
    jobTitle: ["DJ", "Productor Musical"],
    famousTracks: [
      { name: "No Eyes (feat. JAW)" },
      { name: "Heartbeat" },
      { name: "The Drums (Din Daa Daa)" },
      { name: "Liquid Spirit (Claptone Remix)" }
    ],
    famousAlbums: [
      { name: "Charmer (2015)" },
      { name: "Fantast (2018)" },
      { name: "Closer (2021)" }
    ],
    wikipediaUrl: "https://es.wikipedia.org/wiki/Claptone",
    officialWebsite: "https://claptone.com/",
    facebookUrl: "https://www.facebook.com/claptone.official",
    twitterUrl: "https://twitter.com/Claptone_"
  },
  {
    name: "Above & Beyond",
    performerType: "MusicGroup",
    instagramHandle: "aboveandbeyond",
    country: "Reino Unido",
    imageUrl: "https://edm.com/.image/ar_1.91:1%2Cc_fill%2Ccs_srgb%2Cfl_progressive%2Cg_faces:center%2Cq_auto:good%2Cw_1200/MTk2NzcwMDQ2Njk0MTYyNjkx/above-and-beyond.jpg",
    spotifyUrl: "https://open.spotify.com/artist/73jBynjsVtocto11jLyW9D2",
    soundcloudUrl: "https://soundcloud.com/aboveandbeyond",
    bio: "Above & Beyond es un trío británico de trance formado por Jono Grant, Tony McGuinness y Paavo Siljamäki. Son los fundadores de los influyentes sellos Anjunabeats y Anjunadeep. Famosos por sus producciones emotivas y sus shows que crean una profunda conexión con el público, son considerados leyendas del género Trance.",
    description: "Prepárate para una terapia de grupo a través de la música con Above & Beyond. El legendario trío de trance es famoso por crear experiencias emotivas y unificadoras con sus melodías edificantes y mensajes profundos.",
    genres: ["Trance", "Progressive Trance", "Deep House"],
    members: [
      { name: "Jono Grant", role: "DJ", alternateName: "Jono Grant" },
      { name: "Tony McGuinness", role: "DJ", alternateName: "Tony McGuinness" },
      { name: "Paavo Siljamäki", role: "DJ", alternateName: "Paavo Siljamäki" }
    ],
    famousTracks: [
      { name: "Sun & Moon (feat. Richard Bedford)" },
      { name: "Thing Called Love" },
      { name: "Blue Sky Action" },
      { name: "Northern Soul" }
    ],
    famousAlbums: [
      { name: "Tri-State (2006)" },
      { name: "Group Therapy (2011)" },
      { name: "We Are All We Need (2015)" },
      { name: "Common Ground (2018)" }
    ],
    wikipediaUrl: "https://es.wikipedia.org/wiki/Above_%26_Beyond",
    officialWebsite: "https://www.aboveandbeyond.nu/",
    facebookUrl: "https://www.facebook.com/aboveandbeyond",
    twitterUrl: "https://twitter.com/aboveandbeyond"
  },
  {
    name: "MORTEN",
    performerType: "Person",
    instagramHandle: "mortenofficial",
    country: "Dinamarca",
    imageUrl: "https://weraveyou.com/wp-content/uploads/2023/10/MORTEN-Press-2023.jpg",
    spotifyUrl: "https://open.spotify.com/artist/73jBynjsVtocto11jLyW9D3",
    soundcloudUrl: "https://soundcloud.com/mortenofficial",
    bio: "Morten Breum, conocido como MORTEN, es un DJ y productor danés. Es mundialmente reconocido por ser el co-creador, junto a David Guetta, del género \"Future Rave\". Su sonido combina la energía del Big Room con las texturas oscuras y underground del techno, creando un estilo innovador y potente para la pista principal.",
    description: "Experimenta el poder del Future Rave con uno de sus pioneros, MORTEN. Su sonido innovador, creado junto a David Guetta, fusiona la energía del mainstage con la oscuridad del techno para un set contundente y vanguardista.",
    genres: ["Future Rave", "House", "Electro House"],
    alternateName: "Morten Breum",
    birthDate: "1982-05-26",
    jobTitle: ["DJ", "Productor Musical"],
    famousTracks: [
      { name: "Make It To Heaven (con David Guetta)" },
      { name: "Never Be Alone (con David Guetta)" },
      { name: "Dreams (con David Guetta)" },
      { name: "Permanence" }
    ],
    wikipediaUrl: "https://en.wikipedia.org/wiki/Morten_(DJ)",
    officialWebsite: "https://mortenofficial.com/",
    facebookUrl: "https://www.facebook.com/MORTENofficial",
    twitterUrl: "https://twitter.com/mortenofficial"
  },
  {
    name: "Rezz",
    performerType: "Person",
    instagramHandle: "officialrezz",
    country: "Canadá",
    imageUrl: "https://weraveyou.com/wp-content/uploads/2021/10/Rezz-press-pic.jpeg",
    spotifyUrl: "https://open.spotify.com/artist/73jBynjsVtocto11jLyW9D4",
    soundcloudUrl: "https://soundcloud.com/official-rezz",
    bio: "Isabelle Rezazadeh, conocida como Rezz, es una DJ y productora canadiense. Apodada \"Space Mom\" por sus fans, es famosa por su sonido único de mid-tempo bass, caracterizado por atmósferas oscuras, ritmos hipnóticos y bajos profundos. Sus shows en vivo son una experiencia inmersiva gracias a sus icónicas gafas LED.",
    description: "Déjate hipnotizar por los sonidos de \"Space Mom\". Rezz trae su característico estilo de mid-tempo bass oscuro y profundo para una experiencia audiovisual inmersiva que te transportará a otra galaxia.",
    genres: ["Mid-tempo Bass", "Dubstep", "Electronic", "Techno"],
    alternateName: "Isabelle Rezazadeh",
    birthDate: "1995-03-28",
    jobTitle: ["DJ", "Productora Musical"],
    famousTracks: [
      { name: "Edge" },
      { name: "Hex (con 1788-L)" },
      { name: "Someone Else (con Grabbitz)" },
      { name: "Taste of You (feat. Dove Cameron)" }
    ],
    famousAlbums: [
      { name: "Mass Manipulation (2017)" },
      { name: "Certain Kind of Magic (2018)" },
      { name: "Spiral (2021)" }
    ],
    wikipediaUrl: "https://en.wikipedia.org/wiki/Rezz",
    officialWebsite: "https://www.officialrezz.com/",
    facebookUrl: "https://www.facebook.com/OfficialRezz",
    twitterUrl: "https://twitter.com/OfficialRezz"
  },
  {
    name: "Amelie Lens",
    performerType: "Person",
    instagramHandle: "amelie_lens",
    country: "Bélgica",
    imageUrl: "https://www.edmsauce.com/wp-content/uploads/2021/08/amelie-lens-1.jpeg",
    spotifyUrl: "https://open.spotify.com/artist/73jBynjsVtocto11jLyW9D5",
    soundcloudUrl: "https://soundcloud.com/amelielens",
    bio: "Amelie Lens es una DJ, productora y dueña de sellos discográficos belga. Se ha convertido en una de las figuras más influyentes de la escena techno contemporánea. Es conocida por su estilo enérgico, que mezcla techno clásico con influencias ácidas y tribales. Es la fundadora de los sellos Lenske y Exhale.",
    description: "La potencia del techno belga, Amelie Lens, toma el control de la noche. Prepárate para un set implacable, lleno de energía y bajos contundentes que te mantendrán bailando hasta el amanecer.",
    genres: ["Techno", "Acid Techno"],
    alternateName: "Amelie Lens",
    birthDate: "1990-05-31",
    jobTitle: ["DJ", "Productora Musical"],
    famousTracks: [
      { name: "In Silence" },
      { name: "Follow" },
      { name: "Drift" },
      { name: "Feel It" }
    ],
    famousAlbums: [
      { name: "Little Robot (EP, 2019)" },
      { name: "Basiel (EP, 2018)" }
    ],
    wikipediaUrl: "https://en.wikipedia.org/wiki/Amelie_Lens",
    officialWebsite: "https://www.amelielens.com/",
    facebookUrl: "https://www.facebook.com/amelielensmusic",
    twitterUrl: "https://twitter.com/amelie_lens"
  },
  {
    name: "Paul van Dyk",
    performerType: "Person",
    instagramHandle: "paulvandyk",
    country: "Alemania",
    imageUrl: "https://weraveyou.com/wp-content/uploads/2023/11/Paul-van-Dyk-Press-2023.jpg",
    spotifyUrl: "https://open.spotify.com/artist/73jBynjsVtocto11jLyW9D6",
    soundcloudUrl: "https://soundcloud.com/paulvandykofficial",
    bio: "Matthias Paul, conocido como Paul van Dyk, es un DJ y productor alemán, considerado una de las mayores leyendas en la historia de la música Trance. Ganador de un Grammy, ha sido una figura fundamental en el desarrollo del género desde los años 90. Su tema \"For an Angel\" es uno de los himnos más icónicos de la música electrónica.",
    description: "Una verdadera leyenda del Trance, Paul van Dyk, trae su sonido atemporal y su pasión inigualable al escenario. Un set suyo es un viaje a través de la historia de la música electrónica, lleno de melodías eufóricas y energía pura.",
    genres: ["Trance", "Progressive Trance"],
    alternateName: "Matthias Paul",
    birthDate: "1971-12-16",
    jobTitle: ["DJ", "Productor Musical", "Compositor"],
    famousTracks: [
      { name: "For an Angel" },
      { name: "Nothing But You" },
      { name: "Let Go" },
      { name: "Time Of Our Lives" }
    ],
    famousAlbums: [
      { name: "45 RPM (1994)" },
      { name: "Out There and Back (2000)" },
      { name: "Reflections (2003)" },
      { name: "The Politics of Dancing (Series)" }
    ],
    wikipediaUrl: "https://es.wikipedia.org/wiki/Paul_van_Dyk",
    officialWebsite: "https://paulvandyk.com/",
    facebookUrl: "https://www.facebook.com/PVD",
    twitterUrl: "https://twitter.com/PAULVANDYK"
  },
  {
    name: "Eric Prydz",
    performerType: "Person",
    instagramHandle: "ericprydz",
    country: "Suecia",
    imageUrl: "https://weraveyou.com/wp-content/uploads/2022/10/Eric-Prydz-press-2022.jpg",
    spotifyUrl: "https://open.spotify.com/artist/73jBynjsVtocto11jLyW9D7",
    soundcloudUrl: "https://soundcloud.com/eric-prydz",
    bio: "Eric Prydz es un DJ y productor sueco, una de las figuras más respetadas e influyentes de la música house y techno. Conocido por su perfeccionismo, produce bajo su propio nombre (house progresivo), Pryda (progressive house) y Cirez D (techno). Sus espectáculos en vivo, como HOLO, son legendarios por su innovadora tecnología visual.",
    description: "El maestro del progressive house, Eric Prydz, presenta un set que es una obra de arte sónica. Conocido por sus producciones meticulosas y sus visuales revolucionarios, su show es una experiencia inmersiva que redefine los límites de la música electrónica.",
    genres: ["Progressive House", "House", "Techno", "Tech House"],
    alternateName: "Eric Sheridan Prydz",
    birthDate: "1976-07-19",
    jobTitle: ["DJ", "Productor Musical"],
    famousTracks: [
      { name: "Opus" },
      { name: "Call on Me" },
      { name: "Pjanoo" },
      { name: "Every Day" }
    ],
    famousAlbums: [
      { name: "Opus (2016)" },
      { name: "Pryda (2012)" }
    ],
    wikipediaUrl: "https://es.wikipedia.org/wiki/Eric_Prydz",
    officialWebsite: "https://ericprydz.com/",
    facebookUrl: "https://www.facebook.com/EricPrydzOfficial",
    twitterUrl: "https://twitter.com/ericprydz"
  },
  {
    name: "Adam Beyer",
    performerType: "Person",
    instagramHandle: "realadambeyer",
    country: "Suecia",
    imageUrl: "https://edm.com/.image/ar_1.91:1%2Cc_fill%2Ccs_srgb%2Cfl_progressive%2Cg_faces:center%2Cq_auto:good%2Cw_1200/MTY4NjY2NDQ2NDc3NDgxMDc0/adam-beyer.jpg",
    spotifyUrl: "https://open.spotify.com/artist/73jBynjsVtocto11jLyW9D8",
    soundcloudUrl: "https://soundcloud.com/adambeyer",
    bio: "Adam Beyer es un DJ y productor sueco, fundador del influyente sello Drumcode. Es una de las figuras más importantes del techno a nivel mundial. Su sonido es potente, percusivo y funcional para la pista de baile, y su marca Drumcode se ha convertido en sinónimo de techno de alta calidad, con un festival y eventos en todo el mundo.",
    description: "El jefe de Drumcode, Adam Beyer, trae su inconfundible sonido techno al escenario. Prepárate para un set potente, preciso y meticulosamente construido por uno de los titanes más respetados del género.",
    genres: ["Techno", "Tech House"],
    alternateName: "Adam Beyer",
    birthDate: "1976-05-15",
    jobTitle: ["DJ", "Productor Musical"],
    famousTracks: [
      { name: "Your Mind (con Bart Skils)" },
      { name: "Teach Me" },
      { name: "Space Date (con Layton Giordani & Green Velvet)" },
      { name: "No Defeat No Retreat" }
    ],
    famousAlbums: [
      { name: "Decoded (1996)" },
      { name: "Ignition Key (2002)" }
    ],
    wikipediaUrl: "https://en.wikipedia.org/wiki/Adam_Beyer",
    officialWebsite: "https://www.drumcode.se/",
    facebookUrl: "https://www.facebook.com/realadambeyer",
    twitterUrl: "https://twitter.com/realadambeyer"
  },
  {
    name: "Jamie Jones",
    performerType: "Person",
    instagramHandle: "jamiejonesmusic",
    country: "Reino Unido",
    imageUrl: "https://geo-media.beatport.com/image/25292415-3b95-46bd-8c70-6da13d11b32d.jpg",
    spotifyUrl: "https://open.spotify.com/artist/73jBynjsVtocto11jLyW9D9",
    soundcloudUrl: "https://soundcloud.com/jamiejonesmusic",
    bio: "Jamie Jones es un DJ, productor y jefe de sello galés. Es el líder de la banda Hot Natured y el fundador de la influyente marca Hot Creations. Se le atribuye ser uno de los pioneros de un nuevo sonido de house que mezcla influencias del deep house y el techno con bajos cálidos y melodías pegadizas.",
    description: "El cerebro detrás de Hot Creations, Jamie Jones, trae su sonido house característico. Sus sets son un viaje lleno de groove, bajos cálidos y vibraciones contagiosas que han definido las pistas de baile de Ibiza y de todo el mundo.",
    genres: ["Tech House", "House", "Deep House"],
    alternateName: "Jamie Jones",
    birthDate: "1980-10-28",
    jobTitle: ["DJ", "Productor Musical"],
    famousTracks: [
      { name: "My Paradise" },
      { name: "Hungry for the Power" },
      { name: "Bionic Boy" },
      { name: "Forward Motion (con Hot Natured)" }
    ],
    famousAlbums: [
      { name: "Don't You Remember The Future (2009)" }
    ],
    wikipediaUrl: "https://en.wikipedia.org/wiki/Jamie_Jones_(DJ)",
    officialWebsite: "(No tiene sitio oficial activo, se enfoca en Hot Creations)",
    facebookUrl: "https://www.facebook.com/jamiejonesmusic",
    twitterUrl: "https://twitter.com/jamiejonesmusic"
  },
  {
    name: "Brennan Heart",
    performerType: "Person",
    instagramHandle: "brennanheart",
    country: "Países Bajos",
    imageUrl: "https://www.insomniac.com/music/artists/brennan-heart/brennan-heart_1677610143891-1-scaled.jpg",
    spotifyUrl: "https://open.spotify.com/artist/1rS4GPddsfdt2WEi0sMMn40",
    soundcloudUrl: "https://soundcloud.com/brennanheart",
    bio: "Fabian Bohn, conocido como Brennan Heart, es un DJ y productor neerlandés, una de las figuras más importantes e influyentes del Hardstyle. Fundador del sello \"I AM HARDSTYLE\", es conocido por sus melodías eufóricas y su habilidad para crear himnos que conectan profundamente con la comunidad hardstyle.",
    description: "¡El embajador del Hardstyle ha llegado! Brennan Heart trae sus melodías épicas y sus kicks contundentes para una noche dedicada a los verdaderos amantes de los ritmos duros. Canta junto a los himnos que han definido un género.",
    genres: ["Hardstyle", "Hard Dance"],
    alternateName: "Fabian Bohn",
    birthDate: "1982-03-02",
    jobTitle: ["DJ", "Productor Musical"],
    famousTracks: [
      { name: "Imaginary" },
      { name: "Lose My Mind (con Wildstylez)" },
      { name: "Just As Easy" },
      { name: "All On Me" }
    ],
    famousAlbums: [
      { name: "Musical Impressions (2009)" },
      { name: "I Am Hardstyle (2016)" }
    ],
    wikipediaUrl: "https://en.wikipedia.org/wiki/Brennan_Heart",
    officialWebsite: "https://www.brennanheart.com/",
    facebookUrl: "https://www.facebook.com/brennanheart",
    twitterUrl: "https://twitter.com/brennanheart"
  },
  {
    name: "MATTN",
    performerType: "Person",
    instagramHandle: "mattnworld",
    country: "Bélgica",
    imageUrl: "https://weraveyou.com/wp-content/uploads/2022/10/MATTN-Press-pic.jpg",
    spotifyUrl: "https://open.spotify.com/artist/1rS4GPddsfdt2WEi0sMMn41",
    soundcloudUrl: "https://soundcloud.com/mattnworld",
    bio: "Anouk Matton, conocida como MATTN, es una DJ y productora belga. Se ha establecido como una de las artistas femeninas más destacadas de la escena Big Room y mainstage. Con el apoyo de su esposo Dimitri Vegas y su sello Smash The House, ha actuado en los escenarios principales de festivales como Tomorrowland.",
    description: "La energía femenina del mainstage, MATTN, toma el control de la cabina. Con sus ritmos de Big Room y su presencia magnética, está lista para hacer que todos salten y bailen sin parar.",
    genres: ["Big Room", "Electro House", "House"],
    alternateName: "Anouk Matton",
    birthDate: "1992-12-18",
    jobTitle: ["DJ", "Productora Musical"],
    famousTracks: [
      { name: "Girlz Wanna Have Fun (con Stavros Martina & Kevin D)" },
      { name: "Late (con HIDDN)" },
      { name: "The Logical Song" },
      { name: "Don't Tell Me No" }
    ],
    wikipediaUrl: "https://en.wikipedia.org/wiki/MATTN",
    officialWebsite: "(No tiene sitio oficial activo)",
    facebookUrl: "https://www.facebook.com/MATTNworld",
    twitterUrl: "https://twitter.com/mattnworld"
  },
  {
    name: "Boris Brejcha",
    performerType: "Person",
    instagramHandle: "borisbrejcha",
    country: "Alemania",
    imageUrl: "https://weraveyou.com/wp-content/uploads/2022/01/Boris-Brejcha.jpg",
    spotifyUrl: "https://open.spotify.com/artist/1rS4GPddsfdt2WEi0sMMn42",
    soundcloudUrl: "https://soundcloud.com/boris-brejcha",
    bio: "Boris Brejcha es un DJ y productor alemán, conocido por su máscara de carnaval veneciana y por ser el creador de su propio género: \"High-Tech Minimal\". Su sonido es una mezcla única de techno, minimal y melodías emotivas, creando una experiencia musical distintiva que lo ha convertido en un fenómeno de culto.",
    description: "El hombre de la máscara presenta su \"High-Tech Minimal\". Boris Brejcha ofrece un set único que combina la precisión del minimal con melodías complejas y bajos potentes para un viaje sónico que no se parece a ningún otro.",
    genres: ["High-Tech Minimal", "Techno", "Minimal Techno"],
    alternateName: "Boris Brejcha",
    birthDate: "1981-11-26",
    jobTitle: ["DJ", "Productor Musical"],
    famousTracks: [
      { name: "Purple Noise" },
      { name: "Gravity (feat. Laura Korinth)" },
      { name: "Doppler" },
      { name: "House Music" }
    ],
    famousAlbums: [
      { name: "Die Maschinen Kontrollieren Uns (2007)" },
      { name: "22 (2016)" },
      { name: "Space Diver (2020)" }
    ],
    wikipediaUrl: "https://en.wikipedia.org/wiki/Boris_Brejcha",
    officialWebsite: "https://www.borisbrejcha.de/",
    facebookUrl: "https://www.facebook.com/BorisBrejcha.Official",
    twitterUrl: "https://twitter.com/BB_BORISBREJCHA"
  },
  {
    name: "Angerfist",
    performerType: "Person",
    instagramHandle: "angerfist_official",
    country: "Países Bajos",
    imageUrl: "https://www.mastersofhardcore.com/wp-content/uploads/2023/02/Angerfist-Presskit-2023-1-of-1-scaled.jpg",
    spotifyUrl: "https://open.spotify.com/artist/1rS4GPddsfdt2WEi0sMMn43",
    soundcloudUrl: "https://soundcloud.com/angerfistmusic",
    bio: "Danny Masseling, conocido como Angerfist, es un DJ y productor neerlandés, considerado el rey indiscutible del Hardcore. Con su icónica máscara de hockey y su sonido agresivo y sin concesiones, ha dominado la escena hardcore por casi dos décadas, encabezando los festivales más importantes del género en todo el mundo.",
    description: "\"Raise your fist for Angerfist!\" El maestro del Hardcore está aquí para desatar un caos sonoro. Prepárate para los kicks más duros, los ritmos más rápidos y una energía implacable que pondrá a prueba tu resistencia.",
    genres: ["Hardcore", "Gabber"],
    alternateName: "Danny Masseling",
    birthDate: "1981-06-20",
    jobTitle: ["DJ", "Productor Musical"],
    famousTracks: [
      { name: "Raise & Revolt" },
      { name: "Pennywise" },
      { name: "Solid Stigma" },
      { name: "Breinbreker" }
    ],
    famousAlbums: [
      { name: "Pissin' Razorbladez (2006)" },
      { name: "The Deadfaced Dimension (2014)" },
      { name: "Diabolic Dice (2019)" }
    ],
    wikipediaUrl: "https://en.wikipedia.org/wiki/Angerfist",
    officialWebsite: "https://angerfist.nl/",
    facebookUrl: "https://www.facebook.com/angerfistmusic",
    twitterUrl: "https://twitter.com/dj_angerfist"
  },
  {
    name: "Joel Corry",
    performerType: "Person",
    instagramHandle: "joelcorry",
    country: "Reino Unido",
    imageUrl: "https://weraveyou.com/wp-content/uploads/2022/10/Joel-Corry-Press-pic.jpg",
    spotifyUrl: "https://open.spotify.com/artist/1rS4GPddsfdt2WEi0sMMn44",
    soundcloudUrl: "https://soundcloud.com/joelcorry",
    bio: "Joel Corry es un DJ, productor y personalidad de la televisión británico. Saltó a la fama mundial con su éxito \"Sorry\" en 2019 y desde entonces se ha convertido en un pilar del house comercial y el dance-pop. Sus producciones pegadizas y llenas de energía le han valido múltiples nominaciones a los premios Brit y miles de millones de reproducciones.",
    description: "El creador de éxitos del Reino Unido, Joel Corry, trae la fiesta a la pista de baile. Con un set cargado de sus éxitos virales como \"Head & Heart\" y \"BED\", prepárate para cantar y bailar con los ritmos más contagiosos del house actual.",
    genres: ["House", "Dance-pop", "Electronic"],
    alternateName: "Joel Corry",
    birthDate: "1989-06-10",
    jobTitle: ["DJ", "Productor Musical"],
    famousTracks: [
      { name: "Head & Heart (feat. MNEK)" },
      { name: "Sorry" },
      { name: "BED (con RAYE & David Guetta)" },
      { name: "OUT OUT (con Jax Jones)" }
    ],
    famousAlbums: [
      { name: "Another Friday Night (2023)" }
    ],
    wikipediaUrl: "https://en.wikipedia.org/wiki/Joel_Corry",
    officialWebsite: "https://www.joelcorry.com/",
    facebookUrl: "https://www.facebook.com/JoelCorry",
    twitterUrl: "https://twitter.com/joelcorry"
  },
  {
    name: "Ummet Ozcan",
    performerType: "Person",
    instagramHandle: "ummetozcan",
    country: "Países Bajos",
    imageUrl: "https://weraveyou.com/wp-content/uploads/2020/05/Ummet-Ozcan-Press-Kit-2020-2.jpg",
    spotifyUrl: "https://open.spotify.com/artist/1rS4GPddsfdt2WEi0sMMn45",
    soundcloudUrl: "https://soundcloud.com/ummetozcan",
    bio: "Ummet Ozcan es un DJ y productor neerlandés de ascendencia turca. Es una figura prominente en la escena Big Room y electro house, conocido por sus potentes líneas de bajo y melodías épicas. Además de su carrera musical, también es desarrollador de software, creando sintetizadores y efectos utilizados por productores de todo el mundo.",
    description: "El maestro del Big Room, Ummet Ozcan, está aquí para hacer temblar el suelo. Conocido por himnos de festival como \"The Hum\" y \"Raise Your Hands\", su set es una explosión de energía y bajos potentes de principio a fin.",
    genres: ["Big Room", "Electro House", "Psytrance"],
    alternateName: "Ummet Ozcan",
    birthDate: "1982-08-16",
    jobTitle: ["DJ", "Productor Musical", "Desarrollador de Software"],
    famousTracks: [
      { name: "The Hum (vs. Dimitri Vegas & Like Mike)" },
      { name: "Raise Your Hands" },
      { name: "Smash!" },
      { name: "Melody (con Steve Aoki & Dimitri Vegas & Like Mike)" }
    ],
    wikipediaUrl: "https://es.wikipedia.org/wiki/Ummet_Ozcan",
    officialWebsite: "https://ummetozcan.com/",
    facebookUrl: "https://www.facebook.com/UmmetOzcanOfficial",
    twitterUrl: "https://twitter.com/UmmetOzcan"
  },
  {
    name: "Nervo",
    performerType: "MusicGroup",
    instagramHandle: "nervomusic",
    country: "Australia",
    imageUrl: "https://weraveyou.com/wp-content/uploads/2023/12/NERVO-Press-2023.jpg",
    spotifyUrl: "https://open.spotify.com/artist/1rS4GPddsfdt2WEi0sMMn46",
    soundcloudUrl: "https://soundcloud.com/nervomusic",
    bio: "Miriam y Olivia Nervo son un dúo de DJs, productoras y cantautoras australianas. Comenzaron su carrera escribiendo éxitos para otros artistas, incluyendo el Grammy \"When Love Takes Over\" de David Guetta. Como artistas, se han consolidado como una de las duplas femeninas más exitosas del EDM, conocidas por su energía contagiosa y sus himnos de festival.",
    description: "¡La energía inigualable de las hermanas NERVO llega al escenario! El dúo australiano más icónico del EDM está listo para desatar una fiesta con sus vocales en vivo, producciones enérgicas y una conexión con el público que es pura dinamita.",
    genres: ["Electro House", "Progressive House", "Pop", "EDM"],
    members: [
      { name: "Miriam Nervo", role: "DJ", alternateName: "Miriam Nervo" },
      { name: "Olivia Nervo", role: "DJ", alternateName: "Olivia Nervo" }
    ],
    famousTracks: [
      { name: "Like Home (con Nicky Romero)" },
      { name: "The Way We See The World" },
      { name: "Reason (con Hook N Sling)" },
      { name: "Revolution (con R3hab & Ummet Ozcan)" }
    ],
    famousAlbums: [
      { name: "Collateral (2015)" }
    ],
    wikipediaUrl: "https://es.wikipedia.org/wiki/Nervo",
    officialWebsite: "https://www.nervomusic.com/",
    facebookUrl: "https://www.facebook.com/NERVOMusic",
    twitterUrl: "https://twitter.com/nervomusic"
  },
  {
    name: "ATB",
    performerType: "Person",
    instagramHandle: "atb",
    country: "Alemania",
    imageUrl: "https://www.edmtunes.com/wp-content/uploads/2021/05/atb-press-2021-2.jpg",
    spotifyUrl: "https://open.spotify.com/artist/1rS4GPddsfdt2WEi0sMMn47",
    soundcloudUrl: "https://soundcloud.com/atb-music",
    bio: "André Tanneberger, conocido como ATB, es un DJ y productor alemán, considerado una leyenda de la música Trance. Saltó a la fama mundial en 1998 con su icónico sencillo \"9 PM (Till I Come)\", que se convirtió en un himno global. Su sonido melódico y emotivo ha influido en generaciones de artistas y fans.",
    description: "Una leyenda viviente del Trance, ATB, trae su sonido icónico al escenario. Prepárate para un viaje nostálgico y eufórico con clásicos atemporales como \"9 PM (Till I Come)\" y sus producciones más recientes.",
    genres: ["Trance", "Progressive House", "Electronic"],
    alternateName: "André Tanneberger",
    birthDate: "1973-02-26",
    jobTitle: ["DJ", "Productor Musical", "Compositor"],
    famousTracks: [
      { name: "9 PM (Till I Come)" },
      { name: "Ecstasy" },
      { name: "Don't Stop" },
      { name: "Your Love (9PM) (con Topic & A7S)" }
    ],
    famousAlbums: [
      { name: "Movin' Melodies (1999)" },
      { name: "No Silence (2004)" },
      { name: "Contact (2014)" }
    ],
    wikipediaUrl: "https://es.wikipedia.org/wiki/ATB",
    officialWebsite: "https://www.atb-music.com/",
    facebookUrl: "https://www.facebook.com/ATB",
    twitterUrl: "https://twitter.com/atbandre"
  },
  {
    name: "Miss K8",
    performerType: "Person",
    instagramHandle: "missk8",
    country: "Ucrania",
    imageUrl: "https://www.mastersofhardcore.com/wp-content/uploads/2023/02/Miss-K8-Presskit-2023-2-of-3-scaled.jpg",
    spotifyUrl: "https://open.spotify.com/artist/1rS4GPddsfdt2WEi0sMMn48",
    soundcloudUrl: "https://soundcloud.com/missk8",
    bio: "Kateryna Kremko, conocida como Miss K8, es una DJ y productora ucraniana, apodada la \"Diosa del Hardcore\". Es una de las figuras femeninas más importantes y respetadas en la escena Hardcore y Frenchcore. Su estilo es agresivo, enérgico y directo, lo que la ha llevado a los escenarios principales de los festivales más duros del mundo como Masters of Hardcore y Dominator.",
    description: "¡La Diosa del Hardcore ha llegado! Miss K8 desata una tormenta de beats implacables y una energía arrolladora. Prepárate para una dosis de hardcore sin concesiones de la mano de una de sus reinas indiscutibles.",
    genres: ["Hardcore", "Frenchcore", "Gabber"],
    alternateName: "Kateryna Kremko",
    birthDate: "1989-06-18",
    jobTitle: ["DJ", "Productora Musical"],
    famousTracks: [
      { name: "Raiders of Rampage (con Radical Redemption)" },
      { name: "Out of the Frame" },
      { name: "Temper" },
      { name: "Impact (con Angerfist)" }
    ],
    famousAlbums: [
      { name: "Magnet (2016)" },
      { name: "Eclipse (2022)" }
    ],
    wikipediaUrl: "https://en.wikipedia.org/wiki/Miss_K8",
    officialWebsite: "https://www.djmissk8.com/",
    facebookUrl: "https://www.facebook.com/MissK8music",
    twitterUrl: "https://twitter.com/missk8music"
  },
  {
    name: "Black Coffee",
    performerType: "Person",
    instagramHandle: "realblackcoffee",
    country: "Sudáfrica",
    imageUrl: "https://weraveyou.com/wp-content/uploads/2022/01/Black-Coffee-press-pic.jpg",
    spotifyUrl: "https://open.spotify.com/artist/1rS4GPddsfdt2WEi0sMMn49",
    soundcloudUrl: "https://soundcloud.com/djblackcoffee",
    bio: "Nkosinathi Innocent Maphumulo, conocido como Black Coffee, es un DJ y productor sudafricano. Ganador de un premio Grammy, es uno de los artistas más influyentes y respetados del mundo, pionero en llevar el sonido del Afro House a una audiencia global. Su estilo sofisticado, profundo y conmovedor lo ha convertido en un ícono de la música house.",
    description: "El pionero del Afro House y ganador del Grammy, Black Coffee, trae su sonido sofisticado y conmovedor a la cabina. Prepárate para un viaje musical profundo y elegante que fusiona ritmos africanos con la esencia del house.",
    genres: ["Afro House", "Deep House", "House"],
    alternateName: "Nkosinathi Innocent Maphumulo",
    birthDate: "1976-03-11",
    jobTitle: ["DJ", "Productor Musical"],
    famousTracks: [
      { name: "Drive (con David Guetta)" },
      { name: "Superman (con Bucie)" },
      { name: "Your Eyes (con Shekhinah)" },
      { name: "Get It Together (con Drake)" }
    ],
    famousAlbums: [
      { name: "Home Brewed (2009)" },
      { name: "Pieces of Me (2015)" },
      { name: "Subconsciously (2021)" }
    ],
    wikipediaUrl: "https://es.wikipedia.org/wiki/Black_Coffee",
    officialWebsite: "https://www.realblackcoffee.net/",
    facebookUrl: "https://www.facebook.com/realblackcoffee",
    twitterUrl: "https://twitter.com/realblackcoffee"
  },
  {
    name: "Danny Avila",
    performerType: "Person",
    instagramHandle: "dannyavila",
    country: "España",
    imageUrl: "https://www.edmfever.com/wp-content/uploads/2020/05/Danny-Avila-1.jpg",
    spotifyUrl: "https://open.spotify.com/artist/0CbeG1224FS58zV6G2xfPT0",
    soundcloudUrl: "https://soundcloud.com/dannyavila",
    bio: "Danny Avila es un DJ y productor español que ha irrumpido en la escena internacional con una energía arrolladora. Conocido por su habilidad técnica en las mezclas y su carisma en el escenario, su sonido ha evolucionado desde el Big Room hacia el Tech House y el Mainstage Techno, demostrando una gran versatilidad.",
    description: "La energía de España llega con Danny Avila. Conocido por su increíble habilidad en la cabina y su energía contagiosa, Danny ofrece un set dinámico que fusiona lo mejor del house, techno y sonidos mainstage para una fiesta sin límites.",
    genres: ["Tech House", "House", "Techno", "Big Room"],
    alternateName: "Daniel Avila",
    birthDate: "1995-04-01",
    jobTitle: ["DJ", "Productor Musical"],
    famousTracks: [
      { name: "Breaking Your Fall" },
      { name: "End of the Night" },
      { name: "Thinking About You" },
      { name: "My Blood" }
    ],
    wikipediaUrl: "https://es.wikipedia.org/wiki/Danny_Avila",
    officialWebsite: "https://dannyavila.com/",
    facebookUrl: "https://www.facebook.com/dannyavilaofficial",
    twitterUrl: "https://twitter.com/dannyavila"
  },
  {
    name: "Cat Dealers",
    performerType: "MusicGroup",
    instagramHandle: "catdealers",
    country: "Brasil",
    imageUrl: "https://weraveyou.com/wp-content/uploads/2020/03/Cat-Dealers.jpg",
    spotifyUrl: "https://open.spotify.com/artist/0CbeG1224FS58zV6G2xfPT1",
    soundcloudUrl: "https://soundcloud.com/catdealers",
    bio: "Cat Dealers es un dúo de DJs y productores brasileños formado por los hermanos Lugui y Pedrão. Son una de las fuerzas más grandes de la escena electrónica de Brasil, conocidos por su sonido que mezcla bass house con melodías pop y vocales pegadizas. Han acumulado cientos de millones de reproducciones y han girado por todo el mundo.",
    description: "¡El dúo más grande de Brasil, Cat Dealers, está en la casa! Prepárate para una noche de bass house melódico y energía contagiosa que los ha convertido en un fenómeno global.",
    genres: ["Bass House", "House", "Electronic"],
    members: [
      { name: "Luiz \"Lugui\" Salen", role: "DJ", alternateName: "Luiz Salen" },
      { name: "Pedro \"Pedrão\" Henrique", role: "DJ", alternateName: "Pedro Henrique" }
    ],
    famousTracks: [
      { name: "Your Body (Remix)" },
      { name: "Gravity" },
      { name: "Gone Too Long" },
      { name: "Sunshine" }
    ],
    wikipediaUrl: "https://en.wikipedia.org/wiki/Cat_Dealers",
    officialWebsite: "https://catdealers.com.br/",
    facebookUrl: "https://www.facebook.com/CatDealers",
    twitterUrl: "https://twitter.com/Cat_Dealers"
  },
  {
    name: "Tujamo",
    performerType: "Person",
    instagramHandle: "tujamo",
    country: "Alemania",
    imageUrl: "https://1001tracklists.com/images/artist_pictures/f432w_tujamo.jpg",
    spotifyUrl: "https://open.spotify.com/artist/0CbeG1224FS58zV6G2xfPT2",
    soundcloudUrl: "https://soundcloud.com/tujamo",
    bio: "Matthias Richter, conocido como Tujamo, es un DJ y productor alemán. Es famoso por ser uno de los pioneros de un sonido único que mezcla electro house con influencias bounce y étnicas. Sus producciones energéticas y distintivas, como \"Boneless\" y \"Drop That Low\", se han convertido en elementos básicos de los festivales de todo el mundo.",
    description: "¡Prepárate para el sonido inconfundible de Tujamo! El productor alemán trae su energía bounce y sus ritmos electro house únicos para una noche de baile sin parar.",
    genres: ["Electro House", "Bounce", "House"],
    alternateName: "Matthias Richter",
    birthDate: "1988-01-18",
    jobTitle: ["DJ", "Productor Musical"],
    famousTracks: [
      { name: "Drop That Low (When I Dip)" },
      { name: "Boneless (con Steve Aoki & Chris Lake)" },
      { name: "Who" },
      { name: "Booty Bounce" }
    ],
    wikipediaUrl: "https://es.wikipedia.org/wiki/Tujamo",
    officialWebsite: "https://tujamo.com/",
    facebookUrl: "https://www.facebook.com/Tujamo",
    twitterUrl: "https://twitter.com/itstujamo"
  },
  {
    name: "Nora En Pure",
    performerType: "Person",
    instagramHandle: "noraenpure",
    country: "Suiza",
    imageUrl: "https://edm.com/.image/ar_1:1%2Cc_fill%2Ccs_srgb%2Cfl_progressive%2Cq_auto:good%2Cw_1200/MTk2NTE1MTU0NDE1ODQwMjU5/nora-en-pure.jpg",
    spotifyUrl: "https://open.spotify.com/artist/0CbeG1224FS58zV6G2xfPT3",
    soundcloudUrl: "https://soundcloud.com/noraenpure",
    bio: "Daniela Di Lillo, conocida como Nora En Pure, es una DJ y productora sudafricana-suiza. Es la reina del deep house melódico y orgánico, conocida por su habilidad para fusionar sonidos de la naturaleza, instrumentación clásica y melodías emotivas. Es la fundadora de la marca Purified.",
    description: "Déjate llevar por los paisajes sonoros de Nora En Pure. La reina del deep house melódico te guiará en un viaje musical orgánico y emotivo, lleno de melodías purificadoras y ritmos profundos.",
    genres: ["Deep House", "Melodic House", "House"],
    alternateName: "Daniela Di Lillo",
    birthDate: "(No disponible públicamente)",
    jobTitle: ["DJ", "Productora Musical"],
    famousTracks: [
      { name: "Come With Me" },
      { name: "Tears In Your Eyes" },
      { name: "Birthright" },
      { name: "Us" }
    ],
    wikipediaUrl: "https://en.wikipedia.org/wiki/Nora_En_Pure",
    officialWebsite: "https://noraenpure.com/",
    facebookUrl: "https://www.facebook.com/NoraEnPure",
    twitterUrl: "https://twitter.com/NoraEnPure"
  },
  {
    name: "KAAZE",
    performerType: "Person",
    instagramHandle: "kaazemusic",
    country: "Suecia",
    imageUrl: "https://www.edmfever.com/wp-content/uploads/2021/08/KAAZE.jpg",
    spotifyUrl: "https://open.spotify.com/artist/0CbeG1224FS58zV6G2xfPT4",
    soundcloudUrl: "https://soundcloud.com/kaazeofficial",
    bio: "Mick Kastenholt, conocido como KAAZE, es un DJ y productor sueco. Es uno de los artistas insignia del sello Revealed Recordings de Hardwell. Su sonido es una poderosa mezcla de progressive house y big room con influencias del rock de los 80, creando himnos melódicos y enérgicos para el escenario principal.",
    description: "El sonido del progressive house cinematográfico llega con KAAZE. El protegido de Hardwell trae sus melodías épicas y su energía de festival para un set que combina la emoción del progressive con el poder del big room.",
    genres: ["Progressive House", "Big Room", "Electro House"],
    alternateName: "Mick Kastenholt",
    birthDate: "1989-01-31",
    jobTitle: ["DJ", "Productor Musical"],
    famousTracks: [
      { name: "Triplet (I'm Not Alright)" },
      { name: "We Are Legends (con Hardwell)" },
      { name: "End Of The World" },
      { name: "Sweet Mistake" }
    ],
    famousAlbums: [
      { name: "Dreamchild (2020)" }
    ],
    officialWebsite: "https://www.kaazemusic.com/",
    facebookUrl: "https://www.facebook.com/kaazeofficial",
    twitterUrl: "https://twitter.com/kaazemusic"
  },
  {
    name: "Swedish House Mafia",
    performerType: "MusicGroup",
    instagramHandle: "swedishhousemafia",
    country: "Suecia",
    imageUrl: "https://dancingastronaut.com/wp-content/uploads/2022/04/Swedish-House-Mafia-Paradise-Again.jpg",
    spotifyUrl: "https://open.spotify.com/artist/0CbeG1224FS58zV6G2xfPT5",
    soundcloudUrl: "https://soundcloud.com/officialswedishhousemafia",
    bio: "Swedish House Mafia es un supergrupo sueco de DJs y productores compuesto por Axwell, Steve Angello y Sebastian Ingrosso. Son considerados uno de los actos más influyentes en la historia de la música electrónica, responsables de llevar el progressive house a estadios de todo el mundo con himnos generacionales.",
    description: "La leyenda ha vuelto. Swedish House Mafia, el supergrupo que cambió la música electrónica para siempre, trae sus himnos icónicos y su nuevo sonido para una noche que quedará en la historia. \"Don't You Worry Child\", la mafia está aquí.",
    genres: ["Progressive House", "House", "Electronic"],
    members: [
      { name: "Axwell", role: "DJ", alternateName: "Axel Hedfors" },
      { name: "Steve Angello", role: "DJ", alternateName: "Steven Angello Josefsson Fragogiannis" },
      { name: "Sebastian Ingrosso", role: "DJ", alternateName: "Sebastian Carmine Ingrosso" }
    ],
    famousTracks: [
      { name: "Don't You Worry Child" },
      { name: "Save the World" },
      { name: "One (Your Name)" },
      { name: "Greyhound" }
    ],
    famousAlbums: [
      { name: "Until One (2010)" },
      { name: "Until Now (2012)" },
      { name: "Paradise Again (2022)" }
    ],
    wikipediaUrl: "https://es.wikipedia.org/wiki/Swedish_House_Mafia",
    officialWebsite: "https://swedishhousemafia.com/",
    facebookUrl: "https://www.facebook.com/swedishhousemafia",
    twitterUrl: "https://twitter.com/swedishousemfia"
  },
  {
    name: "Julian Jordan",
    performerType: "Person",
    instagramHandle: "itsjulianjordan",
    country: "Países Bajos",
    imageUrl: "https://weraveyou.com/wp-content/uploads/2023/11/Julian-Jordan-Press-2023.jpg",
    spotifyUrl: "https://open.spotify.com/artist/0CbeG1224FS58zV6G2xfPT6",
    soundcloudUrl: "https://soundcloud.com/julianjordan",
    bio: "Julian Dobbenberg, conocido como Julian Jordan, es un DJ y productor neerlandés. Es un artista clave del sello STMPD RCRDS de Martin Garrix y es conocido por su sonido electro house enérgico, fresco e innovador. Su habilidad para crear drops únicos y potentes lo ha convertido en un favorito de los festivales.",
    description: "¡La energía de STMPD RCRDS llega con Julian Jordan! Prepárate para un set explosivo lleno de electro house innovador y drops contundentes que te harán saltar de principio a fin.",
    genres: ["Electro House", "Progressive House", "Bass House"],
    alternateName: "Julian Dobbenberg",
    birthDate: "1995-08-20",
    jobTitle: ["DJ", "Productor Musical"],
    famousTracks: [
      { name: "The Takedown" },
      { name: "Glitch (con Martin Garrix)" },
      { name: "Oldskool" },
      { name: "Tell Me The Truth" }
    ],
    wikipediaUrl: "https://en.wikipedia.org/wiki/Julian_Jordan",
    officialWebsite: "https://www.julianjordan.com/",
    facebookUrl: "https://www.facebook.com/itsjulianjordan",
    twitterUrl: "https://twitter.com/julianjordan"
  },
  {
    name: "Mariana BO",
    performerType: "Person",
    instagramHandle: "djmarianabo",
    country: "México",
    imageUrl: "https://weraveyou.com/wp-content/uploads/2022/10/Mariana-BO-press.jpg",
    spotifyUrl: "https://open.spotify.com/artist/0CbeG1224FS58zV6G2xfPT7",
    soundcloudUrl: "https://soundcloud.com/marianabomusic",
    bio: "Mariana Bo, originaria de Culiacán, México, es una DJ, productora y violinista. Su show es una fusión única de música electrónica con violín en vivo, combinando la energía del EDM, psytrance y hardstyle con la elegancia de la música clásica. Esta combinación la ha llevado a los escenarios de festivales como Tomorrowland y Ultra.",
    description: "Una fusión única de música electrónica y clásica. Mariana BO trae su increíble show que combina potentes beats de EDM con la pasión del violín en vivo, creando una experiencia musical inolvidable y llena de energía.",
    genres: ["EDM", "Psytrance", "Hardstyle", "Electronic"],
    alternateName: "Sandra Mariana Borrego Robles",
    birthDate: "1990-10-27",
    jobTitle: ["DJ", "Productora Musical", "Violinista"],
    famousTracks: [
      { name: "Kolkata (con Timmy Trumpet & KSHMR)" },
      { name: "Olé Olé" },
      { name: "Shankara" },
      { name: "CEIBA" }
    ],
    wikipediaUrl: "https://es.wikipedia.org/wiki/Mariana_Bo",
    officialWebsite: "https://www.marianabo.com/",
    facebookUrl: "https://www.facebook.com/DJMarianaBO",
    twitterUrl: "https://twitter.com/djmarianabo"
  },
  {
    name: "deadmau5",
    performerType: "Person",
    instagramHandle: "deadmau5",
    country: "Canadá",
    imageUrl: "https://weraveyou.com/wp-content/uploads/2023/11/deadmau5-Press-2023-by-Leah-Sems-scaled.jpg",
    spotifyUrl: "https://open.spotify.com/artist/0CbeG1224FS58zV6G2xfPT8",
    soundcloudUrl: "https://soundcloud.com/deadmau5",
    bio: "Joel Zimmerman, conocido como deadmau5, es un productor y DJ canadiense, una de las figuras más icónicas e influyentes de la música electrónica moderna. Famoso por su \"mau5head\", su sonido progressive house melódico y complejo, y su sello mau5trap, ha redefinido los límites de las actuaciones en vivo y la producción musical.",
    description: "El legendario deadmau5 trae su universo sónico al escenario. Prepárate para un viaje a través del progressive house más innovador con clásicos atemporales como \"Strobe\" y \"Ghosts 'n' Stuff\", todo bajo el icónico \"mau5head\".",
    genres: ["Progressive House", "Electro House", "Techno"],
    alternateName: "Joel Thomas Zimmerman",
    birthDate: "1981-01-05",
    jobTitle: ["Productor Musical", "DJ", "Compositor"],
    famousTracks: [
      { name: "Strobe" },
      { name: "Ghosts 'n' Stuff (feat. Rob Swire)" },
      { name: "I Remember (con Kaskade)" },
      { name: "The Veldt" }
    ],
    famousAlbums: [
      { name: "Random Album Title (2008)" },
      { name: "For Lack of a Better Name (2009)" },
      { name: "4x4=12 (2010)" }
    ],
    wikipediaUrl: "https://es.wikipedia.org/wiki/Deadmau5",
    officialWebsite: "https://deadmau5.com/",
    facebookUrl: "https://www.facebook.com/deadmau5",
    twitterUrl: "https://twitter.com/deadmau5"
  },
  {
    name: "HI-LO",
    performerType: "Person",
    instagramHandle: "officialhilo",
    country: "Países Bajos",
    imageUrl: "https://www.edmfever.com/wp-content/uploads/2023/10/HI-LO-by-ADENA-scaled.jpg",
    spotifyUrl: "https://open.spotify.com/artist/0CbeG1224FS58zV6G2xfPT9",
    soundcloudUrl: "https://soundcloud.com/official-hilo",
    bio: "HI-LO es el alias del aclamado productor neerlandés Oliver Heldens. Bajo este nombre, explora los sonidos más oscuros y contundentes del techno y el bass house. El proyecto ha ganado un inmenso respeto en la escena underground, con lanzamientos en sellos como Drumcode de Adam Beyer y Filth on Acid de Reinier Zonneveld.",
    description: "El alter ego oscuro de Oliver Heldens, HI-LO, toma el control. Prepárate para una inmersión en el techno más potente y el bass house más vanguardista de uno de los productores más talentosos del mundo.",
    genres: ["Techno", "Bass House", "Tech House"],
    alternateName: "Olivier J. L. Heldens",
    birthDate: "1995-02-01",
    jobTitle: ["DJ", "Productor Musical"],
    famousTracks: [
      { name: "Renegade Mastah" },
      { name: "Kronos" },
      { name: "Zeus" },
      { name: "WANNA GO BANG (con DJ Deeon)" }
    ],
    officialWebsite: "https://oliverheldens.com/",
    facebookUrl: "https://www.facebook.com/officialhilo",
    twitterUrl: "https://twitter.com/officialhilo"
  },
  {
    name: "Deborah De Luca",
    performerType: "Person",
    instagramHandle: "deborahdeluca",
    country: "Italia",
    imageUrl: "https://www.clubbingspain.com/imagenes/Deborah-De-Luca-2022.jpg",
    spotifyUrl: "https://open.spotify.com/artist/1VJ0briNOlXRtJUAevxmih0",
    soundcloudUrl: "https://soundcloud.com/deborahdeluca",
    bio: "Deborah De Luca es una DJ y productora italiana, una de las figuras femeninas más populares de la escena techno global. Nacida en Scampia, Nápoles, su música es un reflejo de su fuerte personalidad, mezclando techno duro con elementos melódicos y vocales minimalistas. Es la fundadora del sello Sola_mente Records.",
    description: "La reina napolitana del techno, Deborah De Luca, trae su sonido potente y carismático a la cabina. Sus sets son una fusión de techno contundente y melodías cautivadoras que te harán bailar sin descanso.",
    genres: ["Techno", "Tech House"],
    alternateName: "Deborah De Luca",
    birthDate: "1980-07-23",
    jobTitle: ["DJ", "Productora Musical"],
    famousTracks: [
      { name: "Hey Britney" },
      { name: "Give It To Me" },
      { name: "Dori Me (Remix)" },
      { name: "Fuori" }
    ],
    famousAlbums: [
      { name: "Ten (2018)" },
      { name: "She Sleeps (2020)" }
    ],
    wikipediaUrl: "https://en.wikipedia.org/wiki/Deborah_De_Luca",
    officialWebsite: "https://www.deborahdeluca.it/",
    facebookUrl: "https://www.facebook.com/deborahdelucadj",
    twitterUrl: "https://twitter.com/deborahdeluca"
  },
  {
    name: "Mike Williams",
    performerType: "Person",
    instagramHandle: "mikewilliams",
    country: "Países Bajos",
    imageUrl: "https://weraveyou.com/wp-content/uploads/2023/11/Mike-Williams-Press-2023.jpg",
    spotifyUrl: "https://open.spotify.com/artist/1VJ0briNOlXRtJUAevxmih1",
    soundcloudUrl: "https://soundcloud.com/mikewilliams",
    bio: "Mike Willemsen, conocido como Mike Williams, es un DJ y productor neerlandés. Es una de las figuras más destacadas del Future House y Future Bounce, conocido por su sonido enérgico y melódico. Con el apoyo temprano de Tiësto, ha lanzado música en sellos como Musical Freedom y Spinnin' Records, convirtiéndose en un favorito de los festivales.",
    description: "¡El rey del Future Bounce está aquí! Mike Williams trae su inconfundible sonido melódico y enérgico para una noche llena de buen rollo y drops que te harán sonreír y bailar sin parar.",
    genres: ["Future House", "Future Bounce", "Progressive House"],
    alternateName: "Mike Willemsen",
    birthDate: "1996-11-27",
    jobTitle: ["DJ", "Productor Musical"],
    famousTracks: [
      { name: "The Beat" },
      { name: "Lullaby (con R3hab)" },
      { name: "Feel Good (con Felix Jaehn)" },
      { name: "Wait Another Day (con Mesto)" }
    ],
    wikipediaUrl: "https://en.wikipedia.org/wiki/Mike_Williams_(DJ)",
    officialWebsite: "https://www.mikewilliams.nl/",
    facebookUrl: "https://www.facebook.com/mikewilliamsofficial",
    twitterUrl: "https://twitter.com/mikewilliamsdj"
  },
  {
    name: "Green Velvet",
    performerType: "Person",
    instagramHandle: "greenvelvet",
    country: "Estados Unidos",
    imageUrl: "https://weraveyou.com/wp-content/uploads/2020/05/Green-Velvet-Press-pic.jpg",
    spotifyUrl: "https://open.spotify.com/artist/1VJ0briNOlXRtJUAevxmih2",
    soundcloudUrl: "https://soundcloud.com/green-velvet-1",
    bio: "Curtis Alan Jones, conocido por sus alias Green Velvet y Cajmere, es un productor y DJ estadounidense de Chicago. Es una figura legendaria y excéntrica en la historia del house y el techno. Con su icónico pelo verde, es famoso por sus producciones minimalistas, sus vocales narrativas y temas icónicos como \"Flash\" y \"La La Land\".",
    description: "El legendario pionero de Chicago, Green Velvet, está en la casa. Prepárate para un set excéntrico y electrizante, lleno de clásicos del house y techno que te llevarán a \"La La Land\".",
    genres: ["Tech House", "Techno", "House"],
    alternateName: "Curtis Alan Jones",
    birthDate: "1967-04-26",
    jobTitle: ["DJ", "Productor Musical", "Cantante"],
    famousTracks: [
      { name: "La La Land" },
      { name: "Flash" },
      { name: "Bigger Than Prince (Hot Since 82 Remix)" },
      { name: "Lazer Beams" }
    ],
    famousAlbums: [
      { name: "Constant Chaos (1999)" },
      { name: "Whatever (2001)" },
      { name: "Unshakable (2013)" }
    ],
    wikipediaUrl: "https://en.wikipedia.org/wiki/Green_Velvet",
    officialWebsite: "https://www.green-velvet.com/",
    facebookUrl: "https://www.facebook.com/GreenVelvetFanpage",
    twitterUrl: "https://twitter.com/GreenVelvet_"
  },
  {
    name: "Lucas & Steve",
    performerType: "MusicGroup",
    instagramHandle: "lucasandsteve",
    country: "Países Bajos",
    imageUrl: "https://weraveyou.com/wp-content/uploads/2023/11/Lucas-Steve-Press-2023.jpg",
    spotifyUrl: "https://open.spotify.com/artist/1VJ0briNOlXRtJUAevxmih3",
    soundcloudUrl: "https://soundcloud.com/lucasandsteve",
    bio: "Lucas & Steve es un dúo de DJs y productores neerlandeses compuesto por Lucas de Wert y Steven Jansen. Son conocidos por su sonido house melódico, edificante y lleno de buena energía. Con lanzamientos en sellos como Spinnin' Records, se han convertido en un acto fundamental de la escena future house y progressive house.",
    description: "¡La dosis perfecta de house veraniego llega con Lucas & Steve! El dúo neerlandés trae sus melodías edificantes y su energía positiva para crear una atmósfera de festival inolvidable.",
    genres: ["Future House", "Progressive House", "House"],
    members: [
      { name: "Lucas de Wert", role: "DJ", alternateName: "Lucas de Wert" },
      { name: "Steven Jansen", role: "DJ", alternateName: "Steven Jansen" }
    ],
    famousTracks: [
      { name: "Summer On You (con Sam Feldt)" },
      { name: "Up Till Dawn (On The Move)" },
      { name: "I Want It All" },
      { name: "Perfect (feat. Haris)" }
    ],
    wikipediaUrl: "https://en.wikipedia.org/wiki/Lucas_%26_Steve",
    officialWebsite: "https://lucasandsteve.com/",
    facebookUrl: "https://www.facebook.com/LucasAndSteve",
    twitterUrl: "https://twitter.com/lucasandsteve"
  },
  {
    name: "Alison Wonderland",
    performerType: "Person",
    instagramHandle: "alisonwonderland",
    country: "Australia",
    imageUrl: "https://weraveyou.com/wp-content/uploads/2022/05/Alison-Wonderland-Loner-Press-Image.jpeg",
    spotifyUrl: "https://open.spotify.com/artist/1VJ0briNOlXRtJUAevxmih4",
    soundcloudUrl: "https://soundcloud.com/alisonwonderland",
    bio: "Alexandra Margo Sholler, conocida como Alison Wonderland, es una productora, DJ, cantante y violonchelista australiana. Es una de las artistas femeninas más aclamadas de la música electrónica, conocida por su sonido que fusiona trap, future bass y pop con letras crudas y emocionales. Sus shows en vivo son una catarsis de energía y sentimiento.",
    description: "Adéntrate en el universo emocional y explosivo de Alison Wonderland. La productora y cantante australiana ofrece un show catártico que combina la potencia del trap y el bass con una vulnerabilidad que te llegará al corazón.",
    genres: ["Trap", "Future Bass", "Electronic", "Pop"],
    alternateName: "Alexandra Margo Sholler",
    birthDate: "1986-09-27",
    jobTitle: ["DJ", "Productora Musical", "Cantante", "Músico"],
    famousTracks: [
      { name: "I Want U" },
      { name: "Run" },
      { name: "Church" },
      { name: "Peace" }
    ],
    famousAlbums: [
      { name: "Run (2015)" },
      { name: "Awake (2018)" },
      { name: "Loner (2022)" }
    ],
    wikipediaUrl: "https://en.wikipedia.org/wiki/Alison_Wonderland",
    officialWebsite: "https://alisonwonderland.com/",
    facebookUrl: "https://www.facebook.com/awonderdj",
    twitterUrl: "https://twitter.com/awonderland"
  },
  {
    name: "Plastik Funk",
    performerType: "MusicGroup",
    instagramHandle: "plastikfunk",
    country: "Alemania",
    imageUrl: "https://weraveyou.com/wp-content/uploads/2021/04/plastik-funk.jpeg",
    spotifyUrl: "https://open.spotify.com/artist/1VJ0briNOlXRtJUAevxmih5",
    soundcloudUrl: "https://soundcloud.com/plastikfunk",
    bio: "Plastik Funk es un dúo de DJs y productores alemanes compuesto por Rafael Ximénez y Mikio Gruschinske. Con una carrera que abarca más de dos décadas, son conocidos por su enérgico sonido house. Han colaborado con artistas de la talla de Tujamo y son un pilar en sellos como Spinnin' Records y Revealed Recordings.",
    description: "¡El groove inconfundible de Plastik Funk llega a la pista! El dúo alemán trae su house enérgico y vibrante para una noche donde es imposible quedarse quieto.",
    genres: ["House", "Tech House", "Progressive House"],
    members: [
      { name: "Rafael Ximénez-Barthe", role: "DJ", alternateName: "Rafael Ximénez" },
      { name: "Mikio Gruschinske", role: "DJ", alternateName: "Mikio Gruschinske" }
    ],
    famousTracks: [
      { name: "Who (con Tujamo)" },
      { name: "Dr. Dre (Remix)" },
      { name: "Love & Affection" },
      { name: "Dare (La La La)" }
    ],
    wikipediaUrl: "https://de.wikipedia.org/wiki/Plastik_Funk",
    officialWebsite: "https://www.plastikfunk.com/",
    facebookUrl: "https://www.facebook.com/plastikfunk",
    twitterUrl: "https://twitter.com/plastikfunk"
  },
  {
    name: "Zedd",
    performerType: "Person",
    instagramHandle: "zedd",
    country: "Alemania",
    imageUrl: "https://weraveyou.com/wp-content/uploads/2022/10/Zedd-Press-pic.jpg",
    spotifyUrl: "https://open.spotify.com/artist/1VJ0briNOlXRtJUAevxmih6",
    soundcloudUrl: "https://soundcloud.com/zedd",
    bio: "Anton Zaslavski, conocido como Zedd, es un productor y DJ germano-ruso. Ganador de un premio Grammy, es una de las figuras más importantes en la fusión del electro house con la música pop. Con una formación clásica en piano, su música se caracteriza por melodías complejas y producciones impecables que han resultado en éxitos mundiales masivos.",
    description: "El maestro de la producción y ganador del Grammy, Zedd, trae su espectáculo audiovisual al escenario. Prepárate para cantar a todo pulmón con éxitos mundiales como \"Clarity\" y \"The Middle\" en una noche de pop electrónico perfecto.",
    genres: ["Pop", "Electro House", "Electronic"],
    alternateName: "Anton Zaslavski",
    birthDate: "1989-09-02",
    jobTitle: ["Productor Musical", "DJ", "Compositor", "Músico"],
    famousTracks: [
      { name: "Clarity (feat. Foxes)" },
      { name: "The Middle (con Maren Morris & Grey)" },
      { name: "Stay (con Alessia Cara)" },
      { name: "Break Free (Ariana Grande ft. Zedd)" }
    ],
    famousAlbums: [
      { name: "Clarity (2012)" },
      { name: "True Colors (2015)" }
    ],
    wikipediaUrl: "https://es.wikipedia.org/wiki/Zedd",
    officialWebsite: "https://www.zedd.net/",
    facebookUrl: "https://www.facebook.com/Zedd",
    twitterUrl: "https://twitter.com/Zedd"
  },
  {
    name: "Topic",
    performerType: "Person",
    instagramHandle: "topic",
    country: "Alemania",
    imageUrl: "https://www.edmfever.com/wp-content/uploads/2022/08/Topic.jpg",
    spotifyUrl: "https://open.spotify.com/artist/1VJ0briNOlXRtJUAevxmih7",
    soundcloudUrl: "https://soundcloud.com/topicmusic",
    bio: "Tobias Topic es un DJ y productor alemán. Se ha establecido como un creador de éxitos a nivel mundial con su estilo de dance-pop melancólico y profundo. Su gran éxito \"Breaking Me\" con A7S lo catapultó a la fama internacional, y desde entonces ha colaborado con artistas de renombre, acumulando miles de millones de streams.",
    description: "El creador de éxitos alemán, Topic, trae su sonido melancólico y bailable al escenario. Prepárate para cantar junto a sus éxitos globales como \"Breaking Me\" y \"Your Love (9PM)\" en una noche de deep house emocional.",
    genres: ["Dance-pop", "Deep House", "Electronic"],
    alternateName: "Tobias Topic",
    birthDate: "1992-03-23",
    jobTitle: ["DJ", "Productor Musical"],
    famousTracks: [
      { name: "Breaking Me (con A7S)" },
      { name: "Your Love (9PM) (con ATB & A7S)" },
      { name: "Why Do You Lie To Me (con A7S & Lil Baby)" },
      { name: "My Heart Goes (La Di Da)" }
    ],
    wikipediaUrl: "https://en.wikipedia.org/wiki/Topic_(DJ)",
    officialWebsite: "https://www.topic-music.com/",
    facebookUrl: "https://www.facebook.com/topicproductions",
    twitterUrl: "https://twitter.com/topicmusictv"
  },
  {
    name: "Ofenbach",
    performerType: "MusicGroup",
    instagramHandle: "ofenbachmusic",
    country: "Francia",
    imageUrl: "https://weraveyou.com/wp-content/uploads/2021/08/ofenbach.jpg",
    spotifyUrl: "https://open.spotify.com/artist/1VJ0briNOlXRtJUAevxmih8",
    soundcloudUrl: "https://soundcloud.com/weareofenbach",
    bio: "Ofenbach es un dúo de DJs parisinos compuesto por Dorian Lauduique y César de Rummel. Son conocidos por su sonido que mezcla deep house, rock y pop, creando un estilo distintivo y lleno de energía. Han logrado un éxito masivo en Europa y más allá con temas como \"Be Mine\" y \"Katchi\".",
    description: "¡El dúo parisino Ofenbach trae su irresistible mezcla de rock y house al escenario! Prepárate para una noche de buena energía, melodías pegadizas y un groove que te hará bailar sin parar.",
    genres: ["House", "Dance-pop", "Rock"],
    members: [
      { name: "Dorian Lauduique", role: "DJ", alternateName: "Dorian Lauduique" },
      { name: "César de Rummel", role: "DJ", alternateName: "César de Rummel" }
    ],
    famousTracks: [
      { name: "Be Mine" },
      { name: "Katchi (vs. Nick Waterhouse)" },
      { name: "Wasted Love (feat. Lagique)" },
      { name: "Head Shoulders Knees & Toes (con Quarterhead)" }
    ],
    famousAlbums: [
      { name: "I (2022)" }
    ],
    wikipediaUrl: "https://es.wikipedia.org/wiki/Ofenbach",
    officialWebsite: "https://www.weareofenbach.com/",
    facebookUrl: "https://www.facebook.com/weareofenbach",
    twitterUrl: "https://twitter.com/ofenbachmusic"
  },
  {
    name: "Diego Miranda",
    performerType: "Person",
    instagramHandle: "diegomiranda",
    country: "Portugal",
    imageUrl: "https://weraveyou.com/wp-content/uploads/2021/08/Diego-Miranda.jpg",
    spotifyUrl: "https://open.spotify.com/artist/1VJ0briNOlXRtJUAevxmih9",
    soundcloudUrl: "https://soundcloud.com/diegomiranda",
    bio: "Diego Miranda es un DJ y productor portugués, considerado uno de los artistas electrónicos más importantes de su país. Su sonido energético de electro house y big room lo ha llevado a los escenarios principales de festivales de todo el mundo, incluyendo Tomorrowland y Ultra.",
    description: "¡El DJ número 1 de Portugal, Diego Miranda, está aquí para encender la fiesta! Con su energía inagotable y su potente sonido de electro house, prepárate para un set que te hará saltar de principio a fin.",
    genres: ["Electro House", "Big Room", "House"],
    alternateName: "Diego Miranda",
    birthDate: "1979-01-16",
    jobTitle: ["DJ", "Productor Musical"],
    famousTracks: [
      { name: "Ibiza for Dreams (con Lil Jon)" },
      { name: "Nashville" },
      { name: "Boomshakalak (con Dimitri Vegas & Like Mike)" },
      { name: "Mirrors" }
    ],
    wikipediaUrl: "https://pt.wikipedia.org/wiki/Diego_Miranda",
    officialWebsite: "http://www.diegomiranda.com/",
    facebookUrl: "https://www.facebook.com/diegomiranda.fanpage",
    twitterUrl: "https://twitter.com/djdiegomiranda"
  },
  {
    name: "3 Are Legend",
    performerType: "MusicGroup",
    instagramHandle: "3arelegend",
    country: "Bélgica / Estados Unidos",
    imageUrl: "https://i1.sndcdn.com/artworks-000450596397-2a4s5b-t500x500.jpg",
    spotifyUrl: "https://open.spotify.com/artist/4D75GcNG95ebPtNvoElPzn0",
    soundcloudUrl: "https://soundcloud.com/3-are-legend",
    bio: "3 Are Legend es un supergrupo de EDM formado por los titanes de la escena Dimitri Vegas & Like Mike y Steve Aoki. Este trío es sinónimo de la máxima energía en el escenario principal, combinando el sonido Big Room de los hermanos belgas con el caos festivo de Aoki para crear shows explosivos, a menudo como acto de clausura en festivales como Tomorrowland.",
    description: "¡Tres leyendas del mainstage se unen en una fuerza imparable! 3 Are Legend combina la energía de Dimitri Vegas & Like Mike con la locura de Steve Aoki para un show explosivo, impredecible y lleno de himnos de festival.",
    genres: ["Big Room", "Electro House", "EDM"],
    members: [
      { name: "Dimitri Thivaios", role: "DJ", alternateName: "Dimitri Thivaios" },
      { name: "Michael Thivaios", role: "DJ", alternateName: "Michael Thivaios" },
      { name: "Steve Aoki", role: "DJ", alternateName: "Steven Hiroyuki Aoki" }
    ],
    famousTracks: [
      { name: "Khaleesi (con W&W)" },
      { name: "We Are Legend (con W&W)" },
      { name: "Pump It Up (con Tujamo & Jaxx & Vega)" },
      { name: "Ravers" }
    ],
    wikipediaUrl: "https://en.wikipedia.org/wiki/3_Are_Legend",
    facebookUrl: "https://www.facebook.com/3AreLegend",
    twitterUrl: "https://twitter.com/3arelegend"
  },
  {
    name: "VINAI",
    performerType: "MusicGroup",
    instagramHandle: "vinaiofficial",
    country: "Italia",
    imageUrl: "https://weraveyou.com/wp-content/uploads/2021/04/vinai.jpeg",
    spotifyUrl: "https://open.spotify.com/artist/4D75GcNG95ebPtNvoElPzn1",
    soundcloudUrl: "https://soundcloud.com/wearevinai",
    bio: "VINAI es un dúo de productores italianos compuesto por los hermanos Alessandro y Andrea Vinai. Son conocidos como los reyes del \"Big Room Bounce\", un subgénero que popularizaron con sus producciones enérgicas y sus drops melódicos y rebotantes. Han lanzado música en el prestigioso sello Spinnin' Records.",
    description: "¡Los reyes del Big Room Bounce, VINAI, están listos para hacerte saltar! El dúo italiano trae su sonido enérgico y sus drops contagiosos para una noche de fiesta sin descanso.",
    genres: ["Big Room", "Bounce", "Electro House"],
    members: [
      { name: "Alessandro Vinai", role: "DJ", alternateName: "Alessandro Vinai" },
      { name: "Andrea Vinai", role: "DJ", alternateName: "Andrea Vinai" }
    ],
    famousTracks: [
      { name: "Raveology (con DVBBS)" },
      { name: "How We Party (con R3hab)" },
      { name: "The Wave" },
      { name: "Louder (con Dimitri Vegas & Like Mike)" }
    ],
    wikipediaUrl: "https://en.wikipedia.org/wiki/Vinai",
    officialWebsite: "https://www.wearevinai.com/",
    facebookUrl: "https://www.facebook.com/vinai.official",
    twitterUrl: "https://twitter.com/vinai"
  },
  {
    name: "Blasterjaxx",
    performerType: "MusicGroup",
    instagramHandle: "blasterjaxx",
    country: "Países Bajos",
    imageUrl: "https://weraveyou.com/wp-content/uploads/2023/11/Blasterjaxx-press-2023-scaled.jpg",
    spotifyUrl: "https://open.spotify.com/artist/4D75GcNG95ebPtNvoElPzn2",
    soundcloudUrl: "https://soundcloud.com/blasterjaxx",
    bio: "Blasterjaxx es un dúo de DJs y productores neerlandeses compuesto por Thom Jongkind e Idir Makhlaf. Son una de las fuerzas más grandes del género Big Room, conocidos por sus drops explosivos, melodías épicas y un sonido potente diseñado para los escenarios principales. Son los fundadores del sello Maxximize Records.",
    description: "¡Prepárate para la energía explosiva de Blasterjaxx! El dúo neerlandés es sinónimo de Big Room en su máxima expresión, con drops masivos y melodías épicas que harán vibrar hasta el último rincón del lugar.",
    genres: ["Big Room", "Electro House", "Progressive House"],
    members: [
      { name: "Thom Jongkind", role: "DJ", alternateName: "Thom Jongkind" },
      { name: "Idir Makhlaf", role: "DJ", alternateName: "Idir Makhlaf" }
    ],
    famousTracks: [
      { name: "Faith" },
      { name: "Fifteen (Hardwell Edit)" },
      { name: "Narco (con Timmy Trumpet)" },
      { name: "Bigroom Never Dies (con Hardwell)" }
    ],
    famousAlbums: [
      { name: "Perspective (2019)" }
    ],
    wikipediaUrl: "https://es.wikipedia.org/wiki/Blasterjaxx",
    officialWebsite: "https://www.blasterjaxx.com/",
    facebookUrl: "https://www.facebook.com/BlasterjaxxOfficial",
    twitterUrl: "https://twitter.com/blasterjaxx"
  },
  {
    name: "Ferry Corsten",
    performerType: "Person",
    instagramHandle: "ferrycorsten",
    country: "Países Bajos",
    imageUrl: "https://weraveyou.com/wp-content/uploads/2023/11/Ferry-Corsten-Press-2023-1.jpg",
    spotifyUrl: "https://open.spotify.com/artist/4D75GcNG95ebPtNvoElPzn3",
    soundcloudUrl: "https://soundcloud.com/ferry-corsten",
    bio: "Ferry Corsten es un DJ y productor neerlandés, considerado una de las leyendas pioneras de la música Trance. A lo largo de su carrera, ha utilizado múltiples alias, siendo System F el más famoso. Es conocido por su sonido melódico y enérgico que ha definido el género, y por su programa de radio \"Resonation\".",
    description: "Una leyenda del Trance ocupa la cabina. Ferry Corsten, también conocido como System F, te llevará en un viaje a través de los sonidos más puros y eufóricos del género, desde clásicos atemporales hasta sus producciones más recientes.",
    genres: ["Trance", "Progressive Trance", "House"],
    alternateName: "Ferry Corsten",
    birthDate: "1973-12-04",
    jobTitle: ["DJ", "Productor Musical", "Remixer"],
    famousTracks: [
      { name: "Out of the Blue (como System F)" },
      { name: "Gouryella (con Tiësto)" },
      { name: "Punk" },
      { name: "Beautiful" }
    ],
    famousAlbums: [
      { name: "Out of the Blue (2001)" },
      { name: "L.E.F. (2006)" },
      { name: "Blueprint (2017)" }
    ],
    wikipediaUrl: "https://es.wikipedia.org/wiki/Ferry_Corsten",
    officialWebsite: "https://ferrycorsten.com/",
    facebookUrl: "https://www.facebook.com/FerryCorsten",
    twitterUrl: "https://twitter.com/FerryCorsten"
  },
  {
    name: "James Hype",
    performerType: "Person",
    instagramHandle: "jameshype",
    country: "Reino Unido",
    imageUrl: "https://weraveyou.com/wp-content/uploads/2023/12/James-Hype-Press-2023.jpg",
    spotifyUrl: "https://open.spotify.com/artist/4D75GcNG95ebPtNvoElPzn4",
    soundcloudUrl: "https://soundcloud.com/jameshype",
    bio: "James Hype es un DJ y productor británico conocido por su increíble habilidad técnica en las mezclas y sus producciones de tech house enérgicas. Se convirtió en un fenómeno viral con sus remixes y mashups en vivo. Su éxito mundial \"Ferrari\" consolidó su estatus como uno de los artistas más emocionantes y técnicos de la escena house actual.",
    description: "¡El maestro de las mezclas, James Hype, está aquí para demostrar por qué es uno de los DJs más técnicos del mundo! Prepárate para un set de tech house de alta energía, lleno de remixes exclusivos y una habilidad en la cabina que te dejará sin aliento.",
    genres: ["Tech House", "House"],
    alternateName: "James Edward Lee Marsland",
    birthDate: "1989-11-28",
    jobTitle: ["DJ", "Productor Musical"],
    famousTracks: [
      { name: "Ferrari" },
      { name: "More Than Friends (feat. Kelli-Leigh)" },
      { name: "Afraid (con HARLEE)" },
      { name: "Disconnected (con Tita Lau)" }
    ],
    wikipediaUrl: "https://en.wikipedia.org/wiki/James_Hype",
    officialWebsite: "https://www.jameshype.com/",
    facebookUrl: "https://www.facebook.com/jameshype",
    twitterUrl: "https://twitter.com/jameshype"
  },
  {
    name: "Bassjackers",
    performerType: "MusicGroup",
    instagramHandle: "bassjackers",
    country: "Países Bajos",
    imageUrl: "https://weraveyou.com/wp-content/uploads/2023/12/Bassjackers-Press-pic-2023.jpg",
    spotifyUrl: "https://open.spotify.com/artist/4D75GcNG95ebPtNvoElPzn5",
    soundcloudUrl: "https://soundcloud.com/bassjackers",
    bio: "Bassjackers es un dúo neerlandés de DJs y productores compuesto por Marlon Flohr (el DJ) y Ralph van Hilst (el productor). Son pilares de la escena Big Room y Electro House, conocidos por sus drops increíblemente potentes y su sonido diseñado para destruir las pistas de baile de los festivales más grandes.",
    description: "¡La potencia del Big Room holandés está aquí con Bassjackers! Prepárate para un set implacable, cargado con los drops más duros y la energía más explosiva que te puedas imaginar.",
    genres: ["Big Room", "Electro House"],
    members: [
      { name: "Marlon Flohr", role: "DJ", alternateName: "Marlon Flohr" },
      { name: "Ralph van Hilst", role: "DJ", alternateName: "Ralph van Hilst" }
    ],
    famousTracks: [
      { name: "Mush, Mush" },
      { name: "Savior" },
      { name: "Crackin (Martin Garrix Edit)" },
      { name: "All My Life (con Martin Garrix)" }
    ],
    famousAlbums: [
      { name: "The Biggest (2019)" }
    ],
    wikipediaUrl: "https://es.wikipedia.org/wiki/Bassjackers",
    officialWebsite: "https://www.bassjackers.com/",
    facebookUrl: "https://www.facebook.com/bassjackers",
    twitterUrl: "https://twitter.com/bassjackers"
  }
]

// Helper function to get region for country
function getRegionForCountry(countryName) {
  const name = countryName.toLowerCase()

  // South America
  if (['brasil', 'argentina', 'colombia', 'chile', 'perú', 'ecuador', 'venezuela', 'uruguay', 'paraguay', 'bolivia', 'guyana', 'surinam'].some(c => name.includes(c))) {
    return 'América del Sur'
  }

  // North America
  if (['estados unidos', 'canadá', 'méxico', 'canada', 'usa', 'mexico'].some(c => name.includes(c))) {
    return 'América del Norte'
  }

  // Europe
  if (['países bajos', 'bélgica', 'francia', 'alemania', 'españa', 'italia', 'reino unido', 'portugal', 'suecia', 'noruega', 'dinamarca', 'finlandia', 'irlanda', 'austria', 'suiza', 'polonia', 'rumania', 'grecia', 'turquía', 'holanda', 'belgica'].some(c => name.includes(c))) {
    return 'Europa'
  }

  // Asia
  if (['corea del sur', 'china', 'japón', 'india', 'tailandia', 'vietnam', 'indonesia', 'malasia', 'singapur', 'filipinas', 'rusia', 'arabia saudita', 'emiratos', 'israel', 'corea', 'taiwán', 'bangladés', 'pakistán', 'sri lanka', 'nepal', 'bután', 'maldivas', 'irán', 'irak', 'jordania', 'líbano', 'siria', 'kuwait', 'baréin', 'catar', 'omán', 'yemen', 'georgia', 'armenia', 'azerbaiyán', 'kazajistán', 'kirguistán', 'tayikistán', 'turkmenistán', 'uzbekistán', 'mongolia', 'afganistán', 'laos', 'camboya', 'myanmar', 'brunéi', 'timor oriental'].some(c => name.includes(c))) {
    return 'Asia'
  }

  // Oceania
  if (['australia', 'nueva zelanda', 'fiji', 'samoa', 'tonga', 'vanuatu', 'islas salomón', 'kiribati', 'tuvalu', 'nauru', 'palau', 'estados federados de micronesia', 'islas marshall', 'papúa nueva guinea'].some(c => name.includes(c))) {
    return 'Oceanía'
  }

  // Africa
  if (['egipto', 'marruecos', 'sudáfrica', 'nigeria', 'kenia', 'ghana', 'senegal', 'tanzania', 'argelia', 'túnez', 'libia', 'etiopía', 'sudán', 'uganda', 'ruanda', 'burundi', 'zimbabue', 'zambia', 'malaui', 'mozambique', 'angola', 'namibia', 'botsuana', 'suazilandia', 'lesoto', 'costa de marfil', 'camerún', 'republica del congo', 'republica democratica del congo', 'gabón', 'guinea ecuatorial', 'chad', 'republica centroafricana', 'sudán del sur', 'somalia', 'yibuti', 'eritrea', 'mali', 'níger', 'burkina faso', 'guinea', 'sierra leona', 'liberia', 'mauritania', 'gambia', 'guinea-bisáu', 'cabo verde', 'santo tomé y príncipe', 'seychelles', 'comoras', 'mauricio', 'madagascar', 'zanzíbar'].some(c => name.includes(c))) {
    return 'África'
  }

  // Caribbean
  if (['cuba', 'jamaica', 'haití', 'republica dominicana', 'puerto rico', 'trinidad', 'tobago', 'barbados', 'bahamas', 'santa lucía', 'san vicente', 'granada', 'antigua', 'san cristóbal', 'dominica', 'san martín', 'guadalupe', 'martinica', 'aruba', 'curazao', 'bonaire', 'saba', 'san eustaquio', 'islas vírgenes británicas', 'islas vírgenes de los estados unidos', 'islas caimán', 'islas turcas', 'bermudas', 'anguila', 'montserrat'].some(c => name.includes(c))) {
    return 'Caribe'
  }

  return 'Otro'
}

// Helper function to get country code for country name
function getCountryCode(countryName) {
  const countryCodes = {
    'Afganistán': 'AF',
    'Albania': 'AL',
    'Alemania': 'DE',
    'Andorra': 'AD',
    'Angola': 'AO',
    'Anguila': 'AI',
    'Antigua y Barbuda': 'AG',
    'Arabia Saudita': 'SA',
    'Argelia': 'DZ',
    'Argentina': 'AR',
    'Armenia': 'AM',
    'Aruba': 'AW',
    'Australia': 'AU',
    'Austria': 'AT',
    'Azerbaiyán': 'AZ',
    'Bahamas': 'BS',
    'Bangladés': 'BD',
    'Barbados': 'BB',
    'Baréin': 'BH',
    'Bélgica': 'BE',
    'Belice': 'BZ',
    'Benín': 'BJ',
    'Bermudas': 'BM',
    'Bielorrusia': 'BY',
    'Bolivia': 'BO',
    'Bonaire': 'BQ',
    'Botsuana': 'BW',
    'Brasil': 'BR',
    'Brunéi': 'BN',
    'Bulgaria': 'BG',
    'Burkina Faso': 'BF',
    'Burundi': 'BI',
    'Bután': 'BT',
    'Cabo Verde': 'CV',
    'Camboya': 'KH',
    'Camerún': 'CM',
    'Canadá': 'CA',
    'Catar': 'QA',
    'Chad': 'TD',
    'Chile': 'CL',
    'China': 'CN',
    'Chipre': 'CY',
    'Colombia': 'CO',
    'Comoras': 'KM',
    'Corea del Norte': 'KP',
    'Corea del Sur': 'KR',
    'Costa de Marfil': 'CI',
    'Costa Rica': 'CR',
    'Croacia': 'HR',
    'Cuba': 'CU',
    'Curazao': 'CW',
    'Dinamarca': 'DK',
    'Dominica': 'DM',
    'Ecuador': 'EC',
    'Egipto': 'EG',
    'El Salvador': 'SV',
    'Emiratos Árabes Unidos': 'AE',
    'Eritrea': 'ER',
    'Eslovaquia': 'SK',
    'Eslovenia': 'SI',
    'España': 'ES',
    'Estados Unidos': 'US',
    'Estonia': 'EE',
    'Etiopía': 'ET',
    'Filipinas': 'PH',
    'Finlandia': 'FI',
    'Fiji': 'FJ',
    'Francia': 'FR',
    'Gabón': 'GA',
    'Gambia': 'GM',
    'Georgia': 'GE',
    'Ghana': 'GH',
    'Granada': 'GD',
    'Grecia': 'GR',
    'Guadalupe': 'GP',
    'Guatemala': 'GT',
    'Guinea': 'GN',
    'Guinea Ecuatorial': 'GQ',
    'Guinea-Bisáu': 'GW',
    'Guyana': 'GY',
    'Haití': 'HT',
    'Honduras': 'HN',
    'Hungría': 'HU',
    'India': 'IN',
    'Indonesia': 'ID',
    'Irak': 'IQ',
    'Irán': 'IR',
    'Irlanda': 'IE',
    'Islandia': 'IS',
    'Islas Caimán': 'KY',
    'Islas Marshall': 'MH',
    'Islas Salomón': 'SB',
    'Islas Turcas y Caicos': 'TC',
    'Islas Vírgenes Británicas': 'VG',
    'Islas Vírgenes de los Estados Unidos': 'VI',
    'Israel': 'IL',
    'Italia': 'IT',
    'Jamaica': 'JM',
    'Japón': 'JP',
    'Jordania': 'JO',
    'Kazajistán': 'KZ',
    'Kenia': 'KE',
    'Kirguistán': 'KG',
    'Kiribati': 'KI',
    'Kosovo': 'XK',
    'Kuwait': 'KW',
    'Laos': 'LA',
    'Lesoto': 'LS',
    'Letonia': 'LV',
    'Líbano': 'LB',
    'Liberia': 'LR',
    'Libia': 'LY',
    'Liechtenstein': 'LI',
    'Lituania': 'LT',
    'Luxemburgo': 'LU',
    'Macedonia del Norte': 'MK',
    'Madagascar': 'MG',
    'Malasia': 'MY',
    'Malaui': 'MW',
    'Maldivas': 'MV',
    'Malí': 'ML',
    'Malta': 'MT',
    'Marruecos': 'MA',
    'Martinica': 'MQ',
    'Mauricio': 'MU',
    'Mauritania': 'MR',
    'México': 'MX',
    'Micronesia': 'FM',
    'Moldavia': 'MD',
    'Mónaco': 'MC',
    'Mongolia': 'MN',
    'Montenegro': 'ME',
    'Montserrat': 'MS',
    'Mozambique': 'MZ',
    'Myanmar': 'MM',
    'Namibia': 'NA',
    'Nauru': 'NR',
    'Nepal': 'NP',
    'Nicaragua': 'NI',
    'Níger': 'NE',
    'Nigeria': 'NG',
    'Noruega': 'NO',
    'Nueva Zelanda': 'NZ',
    'Omán': 'OM',
    'Pakistán': 'PK',
    'Palaos': 'PW',
    'Panamá': 'PA',
    'Papúa Nueva Guinea': 'PG',
    'Paraguay': 'PY',
    'Países Bajos': 'NL',
    'Perú': 'PE',
    'Polonia': 'PL',
    'Portugal': 'PT',
    'Puerto Rico': 'PR',
    'Reino Unido': 'GB',
    'República Centroafricana': 'CF',
    'República Checa': 'CZ',
    'República del Congo': 'CG',
    'República Democrática del Congo': 'CD',
    'República Dominicana': 'DO',
    'Rumania': 'RO',
    'Rusia': 'RU',
    'Ruanda': 'RW',
    'Saba': 'BQ',
    'Samoa': 'WS',
    'San Cristóbal y Nieves': 'KN',
    'San Eustaquio': 'BQ',
    'San Marino': 'SM',
    'San Martín': 'MF',
    'San Vicente y las Granadinas': 'VC',
    'Santa Lucía': 'LC',
    'Santo Tomé y Príncipe': 'ST',
    'Senegal': 'SN',
    'Serbia': 'RS',
    'Seychelles': 'SC',
    'Sierra Leona': 'SL',
    'Singapur': 'SG',
    'Siria': 'SY',
    'Somalia': 'SO',
    'Sri Lanka': 'LK',
    'Suazilandia': 'SZ',
    'Sudáfrica': 'ZA',
    'Sudán': 'SD',
    'Sudán del Sur': 'SS',
    'Suecia': 'SE',
    'Suiza': 'CH',
    'Surinam': 'SR',
    'Tailandia': 'TH',
    'Taiwán': 'TW',
    'Tanzania': 'TZ',
    'Tayikistán': 'TJ',
    'Timor Oriental': 'TL',
    'Togo': 'TG',
    'Tonga': 'TO',
    'Trinidad y Tobago': 'TT',
    'Túnez': 'TN',
    'Turkmenistán': 'TM',
    'Turquía': 'TR',
    'Tuvalu': 'TV',
    'Ucrania': 'UA',
    'Uganda': 'UG',
    'Uruguay': 'UY',
    'Uzbekistán': 'UZ',
    'Vanuatu': 'VU',
    'Venezuela': 'VE',
    'Vietnam': 'VN',
    'Yemen': 'YE',
    'Yibuti': 'DJ',
    'Zambia': 'ZM',
    'Zanzíbar': 'TZ',
    'Zimbabue': 'ZW'
  }

  return countryCodes[countryName] || 'XX'
}

async function seedDJs() {
  console.log("🎤 Iniciando seed de DJs...")

  try {
    const djsRef = collection(db, "eventDjs")

    for (const dj of djs) {
      // Check if DJ already exists
      const existingQuery = query(djsRef, where("name", "==", dj.name))
      const existingSnapshot = await getDocs(existingQuery)

      if (!existingSnapshot.empty) {
        console.log(`⏭️  DJ ${dj.name} ya existe, saltando...`)
        continue
      }

      // Check if country exists, if not create it
      const countriesRef = collection(db, "countries")
      const countryQuery = query(countriesRef, where("name", "==", dj.country))
      const countrySnapshot = await getDocs(countryQuery)

      let countryId = null
      if (countrySnapshot.empty) {
        // Create country
        const countryCode = getCountryCode(dj.country)
        const region = getRegionForCountry(dj.country)

        const newCountry = {
          name: dj.country,
          code: countryCode,
          region: region,
          flag: "🏳️"
        }

        const countryDocRef = await addDoc(countriesRef, {
          ...newCountry,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        })

        countryId = countryDocRef.id
        console.log(`🌍 País ${dj.country} creado con código ${countryCode}`)
      } else {
        countryId = countrySnapshot.docs[0].id
      }

      // Prepare DJ data
      const djData = {
        ...dj,
        approved: true,
        createdBy: "seed-script",
        socialLinks: {
          spotify: dj.spotifyUrl || "",
          soundcloud: dj.soundcloudUrl || "",
          website: dj.officialWebsite || "",
          facebook: dj.facebookUrl || "",
          twitter: dj.twitterUrl || "",
          wikipedia: dj.wikipediaUrl || ""
        }
      }

      // Remove URLs from root level
      delete djData.spotifyUrl
      delete djData.soundcloudUrl
      delete djData.officialWebsite
      delete djData.facebookUrl
      delete djData.twitterUrl
      delete djData.wikipediaUrl

      console.log(`Agregando DJ ${dj.name}...`)
      await addDoc(djsRef, {
        ...djData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      })
    }

    console.log("✅ Seed de DJs completado exitosamente!")
  } catch (error) {
    console.error("❌ Error durante el seed de DJs:", error)
    throw error
  }
}

// Ejecutar el seed
seedDJs()
  .then(() => {
    console.log("🎉 Proceso completado!")
    process.exit(0)
  })
  .catch((error) => {
    console.error("💥 Error fatal:", error)
    process.exit(1)
  })