class RegistrarLlegadaDto {
  final int idReserva;
  final bool? adelantarHorario;

  const RegistrarLlegadaDto({required this.idReserva, this.adelantarHorario});

  Map<String, dynamic> toJson() {
    return {
      'id_reserva': idReserva, // ✅ Snake case para el backend
      if (adelantarHorario != null) 'adelantar_horario': adelantarHorario,
    };
  }
}
