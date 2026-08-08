import { Route, Switch } from 'wouter'
import { Shell } from './components/Shell'
import { CommunityPage } from './pages/CommunityPage'
import { GunsmithPage } from './pages/GunsmithPage'
import { HomePage } from './pages/HomePage'
import { LegendsPage } from './pages/LegendsPage'
import { MapsPage } from './pages/MapsPage'
import { NewsPage } from './pages/NewsPage'
import { NotFoundPage } from './pages/NotFoundPage'
import { SeasonPage } from './pages/SeasonPage'
import { SourcesPage } from './pages/SourcesPage'
import { WeaponsPage } from './pages/WeaponsPage'

export default function App() {
  return (
    <Shell>
      <Switch>
        <Route path="/" component={HomePage} />
        <Route path="/season" component={SeasonPage} />
        <Route path="/legends" component={LegendsPage} />
        <Route path="/weapons" component={WeaponsPage} />
        <Route path="/gunsmith" component={GunsmithPage} />
        <Route path="/maps" component={MapsPage} />
        <Route path="/news" component={NewsPage} />
        <Route path="/community" component={CommunityPage} />
        <Route path="/sources" component={SourcesPage} />
        <Route component={NotFoundPage} />
      </Switch>
    </Shell>
  )
}
