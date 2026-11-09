import { Navigate, Route, Routes } from 'react-router-dom'
import { Layout } from './components/Layout'
import { BilSide } from './pages/Bil'
import { FagpersonAdmin } from './pages/FagpersonAdmin'
import { Forside } from './pages/Forside'
import { BekreftelseSide, KasseSide, KurvSide } from './pages/Kasse'
import { Landing } from './pages/Landing'
import { PakkeSide } from './pages/Pakke'
import { Passer } from './pages/Passer'
import { SporsmalSide } from './pages/Sporsmal'
import { Innsikt, Testlogg, TilbakemeldingSide } from './pages/Testsider'

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Forside />} />
        <Route path="/ekstralys/:modell" element={<Landing />} />
        <Route path="/passer" element={<Passer />} />
        <Route path="/passer/bil" element={<BilSide />} />
        <Route path="/passer/sporsmal" element={<SporsmalSide />} />
        <Route path="/passer/pakke" element={<PakkeSide />} />
        <Route path="/kurv" element={<KurvSide />} />
        <Route path="/kasse" element={<KasseSide />} />
        <Route path="/bekreftelse" element={<BekreftelseSide />} />
        <Route path="/fagperson" element={<FagpersonAdmin />} />
        <Route path="/innsikt" element={<Innsikt />} />
        <Route path="/testlogg" element={<Testlogg />} />
        <Route path="/tilbakemelding" element={<TilbakemeldingSide />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  )
}
