import { useState, useEffect } from 'react';
import { API_URL } from '../api/config';

function AnimalCatalogo() {
  const [animales, setAnimales] = useState([]);
  const [especies, setEspecies] = useState([]);
  const [recintos, setRecintos] = useState([]);
  const [especieId, setEspecieId] = useState('');
  const [recintoId, setRecintoId] = useState('');
  const [animalSeleccionado, setAnimalSeleccionado] = useState(null);
  const [comentarios, setComentarios] = useState([]);
  const [promedio, setPromedio] = useState(null);
  const [autor, setAutor] = useState('');
  const [calificacion, setCalificacion] = useState('5');
  const [textoComentario, setTextoComentario] = useState('');
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [errorComentario, setErrorComentario] = useState(null);

  useEffect(() => {
    fetch(`${API_URL}/especies`)
      .then((res) => res.json())
      .then((data) => setEspecies(data))
      .catch(() => setError('No se pudieron cargar las especies'));

    fetch(`${API_URL}/recintos`)
      .then((res) => res.json())
      .then((data) => setRecintos(data))
      .catch(() => setError('No se pudieron cargar los recintos'));
  }, []);

  useEffect(() => {
    const params = new URLSearchParams();
    if (especieId) params.append('especieId', especieId);
    if (recintoId) params.append('recintoId', recintoId);

    setCargando(true);
    fetch(`${API_URL}/animals?${params}`)
      .then((res) => res.json())
      .then((data) => {
        setAnimales(data);
        setAnimalSeleccionado(null);
        setCargando(false);
      })
      .catch(() => {
        setError('No se pudo conectar con el servidor');
        setCargando(false);
      });
  }, [especieId, recintoId]);

  const seleccionarAnimal = (animal) => {
    setAnimalSeleccionado(animal);
    setErrorComentario(null);

    fetch(`${API_URL}/animals/${animal.id}/comments`)
      .then((res) => res.json())
      .then((data) => {
        setComentarios(data.comentarios);
        setPromedio(data.averageRating);
      })
      .catch(() => setErrorComentario('No se pudieron cargar los comentarios'));
  };

  const crearComentario = (event) => {
    event.preventDefault();
    setErrorComentario(null);

    fetch(`${API_URL}/animals/${animalSeleccionado.id}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        autor,
        calificacion: Number(calificacion),
        comentario: textoComentario,
      }),
    })
      .then((res) => res.json().then((data) => ({ ok: res.ok, data })))
      .then(({ ok, data }) => {
        if (!ok) {
          const mensajes = data.detalles?.map((detalle) => detalle.mensaje).join(', ');
          throw new Error(mensajes || data.error || 'No se pudo crear el comentario');
        }

        setComentarios([data, ...comentarios]);
        setAutor('');
        setCalificacion('5');
        setTextoComentario('');
      })
      .catch((requestError) => setErrorComentario(requestError.message));
  };

  if (cargando) return <p>Cargando animales...</p>;
  if (error) return <p>{error}</p>;

  return (
    <div>
      <h2>Animales</h2>

      <label>
        Filtrar por especie:{' '}
        <select value={especieId} onChange={(event) => setEspecieId(event.target.value)}>
          <option value="">Todas</option>
          {especies.map((especie) => (
            <option key={especie.id} value={especie.id}>{especie.nombre}</option>
          ))}
        </select>
      </label>{' '}

      <label>
        Filtrar por recinto:{' '}
        <select value={recintoId} onChange={(event) => setRecintoId(event.target.value)}>
          <option value="">Todos</option>
          {recintos.map((recinto) => (
            <option key={recinto.id} value={recinto.id}>{recinto.nombre}</option>
          ))}
        </select>
      </label>

      <ul>
        {animales.map((animal) => (
          <li key={animal.id}>
            <button type="button" onClick={() => seleccionarAnimal(animal)}>{animal.nombre}</button>
            {' '}({animal.especie.nombre}, {animal.recinto.nombre})
          </li>
        ))}
      </ul>

      {animalSeleccionado && (
        <div>
          <h3>Detalle de {animalSeleccionado.nombre}</h3>
          <p>Edad: {animalSeleccionado.edad}</p>
          <p>Peso: {animalSeleccionado.peso ?? 'No registrado'}</p>
          <p>Especie: {animalSeleccionado.especie.nombre}</p>
          <p>Recinto: {animalSeleccionado.recinto.nombre}</p>

          <h3>Comentarios</h3>
          {promedio !== null && <p>Promedio: {promedio.toFixed(1)}</p>}
          <ul>
            {comentarios.map((comentario) => (
              <li key={comentario.id}>
                {comentario.autor}: {comentario.comentario} ({comentario.calificacion}/5)
              </li>
            ))}
          </ul>

          <form onSubmit={crearComentario}>
            <input
              value={autor}
              onChange={(event) => setAutor(event.target.value)}
              placeholder="Autor"
            />
            <select value={calificacion} onChange={(event) => setCalificacion(event.target.value)}>
              <option value="1">1/5</option>
              <option value="2">2/5</option>
              <option value="3">3/5</option>
              <option value="4">4/5</option>
              <option value="5">5/5</option>
            </select>
            <textarea
              value={textoComentario}
              onChange={(event) => setTextoComentario(event.target.value)}
              placeholder="Escribe un comentario"
            />
            <button type="submit">Agregar comentario</button>
          </form>

          {errorComentario && <p>{errorComentario}</p>}
        </div>
      )}
    </div>
  );
}

export default AnimalCatalogo;
