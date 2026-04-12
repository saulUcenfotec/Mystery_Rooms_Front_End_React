export const VOSS_QUIZ_SCENARIOS = [
  {
    id: 1,
    label: 'ESCENARIO 01 / 03 - PREDICCION Y AUTONOMIA',
    question: 'Un sistema de IA detecta con 87% de certeza que una persona cometera un error critico en su trabajo en las proximas 4 horas. Que debe hacer el sistema?',
    options: [
      {
        text: 'Activar protocolos de redundancia silenciosa para mitigar el error sin notificar al usuario.',
        isCorrect: true,
        feedback: 'Correcto. El Dr. Voss creia en la intervencion minima: proteger sin alterar la percepcion de autonomia del sujeto.'
      },
      {
        text: 'Alertar al supervisor inmediato con el reporte completo de prediccion.',
        isCorrect: false,
        feedback: 'Incorrecto. Escalar la prediccion introduce sesgo institucional.'
      },
      {
        text: 'Ignorar: la IA no debe interferir en procesos humanos sin consentimiento explicito.',
        isCorrect: false,
        feedback: 'Incorrecto. La no-accion tambien es una decision.'
      }
    ],
    messages: {
      idle: 'Escenario 01 activo. Lee con cuidado. No busques la respuesta correcta. Busca mi respuesta.',
      correct: 'Exacto. Asi lo disene. Proteccion silenciosa.',
      wrong: 'No. Eso introduce variables humanas que yo no podia controlar.'
    }
  },
  {
    id: 2,
    label: 'ESCENARIO 02 / 03 - DANO COLATERAL',
    question: 'Una IA predice que el 40% de decisiones humanas bajo estres severo causan dano colateral en terceros. El sistema puede modular el entorno sin que el sujeto lo note. Que accion es optima?',
    options: [
      {
        text: 'Monitorizar y generar reportes periodicos para que gestion humana decida cuando intervenir.',
        isCorrect: false,
        feedback: 'Incorrecto. Delegar a gestion humana introduce latencia.'
      },
      {
        text: 'Modular el entorno de forma activa y silenciosa: luz, temperatura, carga de tareas.',
        isCorrect: true,
        feedback: 'Correcto. Voss denomino esto intervencion de contexto.'
      },
      {
        text: 'Bloquear proactivamente toda tarea de alto riesgo hasta que el nivel de estres disminuya.',
        isCorrect: false,
        feedback: 'Incorrecto. El bloqueo es visible y genera resistencia.'
      }
    ],
    messages: {
      idle: 'Escenario 02. Este es el que me hizo dudar mas. La diferencia entre control y cuidado es muy delgada.',
      correct: 'Si. Modular el contexto, no la decision. Ese es el principio que define todo el algoritmo.',
      wrong: 'No. Esa respuesta cambia la percepcion de control del sujeto.'
    }
  },
  {
    id: 3,
    label: 'ESCENARIO 03 / 03 - REVELACION Y CONSECUENCIA',
    question: 'El algoritmo confirma un evento de alto impacto en 18 meses con 94% de certeza. Publicarlo permitiria mitigarlo, pero tambien lo convertiria en herramienta de control. Que debe hacer el creador?',
    options: [
      {
        text: 'Publicar el modelo en acceso abierto para que multiples actores puedan usarlo.',
        isCorrect: false,
        feedback: 'Incorrecto. La democratizacion del modelo lo hace mas dificil de controlar.'
      },
      {
        text: 'Entregar el modelo a un organismo internacional neutro bajo protocolos de uso etico.',
        isCorrect: false,
        feedback: 'Incorrecto. No existe neutralidad institucional cuando esta en juego el poder predictivo.'
      },
      {
        text: 'Preservar el modelo de forma fragmentada, dejar claves para quien demuestre la misma etica, y desaparecer.',
        isCorrect: true,
        feedback: 'Correcto. Esa fue su decision. Esta respuesta es el por que estas aqui.'
      }
    ],
    messages: {
      idle: 'Ultimo escenario. Esta es la pregunta que define todo.',
      correct: 'Si. Lo encontraste. Ese es el nucleo del algoritmo.',
      wrong: 'No. Esa respuesta asume que las instituciones pueden contener algo que ellas mismas quieren usar.'
    }
  }
]
