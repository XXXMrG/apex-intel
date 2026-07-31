import { Route, Switch } from 'wouter'
import { Shell } from './components/Shell'
import { CommunityPage } from './pages/CommunityPage'
import { HomePage } from './pages/HomePage'
import { LegendsPage } from './pages/LegendsPage'
import { MapsPage } from './pages/MapsPage'
import { NewsPage } from './pages/NewsPage'
import { NotFoundPage } from './pages/NotFoundPage'
import { SourcesPage } from './pages/SourcesPage'
import { WeaponsPage } from './pages/WeaponsPage'

export default function App() {
  return (
    <Shell>
      <Switch>
        <Route path="/" component={HomePage} />
        <Route path="/legends" component={LegendsPage} />
        <Route path="/weapons" component={WeaponsPage} />
        <Route path="/maps" component={MapsPage} />
        <Route path="/news" component={NewsPage} />
        <Route path="/community" component={CommunityPage} />
        <Route path="/sources" component={SourcesPage} />
        <Route component={NotFoundPage} />
      </Switch>
    </Shell>
  )
}
