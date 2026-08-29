"use client";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Users, UserPlus, Trash2, Crown, Shield } from "lucide-react";

export default function TeamsPage() {
  const [teams, setTeams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [teamName, setTeamName] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [selectedTeam, setSelectedTeam] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/teams").then(r => r.json()).then(d => setTeams(d.teams || [])).finally(() => setLoading(false));
  }, []);

  const createTeam = async () => {
    const res = await fetch("/api/teams", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "create", teamName }) });
    const data = await res.json();
    if (data.team) { setTeams([data.team, ...teams]); setShowCreate(false); setTeamName(""); }
  };

  const inviteMember = async (teamId: string) => {
    await fetch("/api/teams", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "invite", teamId, email: inviteEmail }) });
    setInviteEmail("");
  };

  const removeMember = async (teamId: string, userId: string) => {
    await fetch("/api/teams", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ teamId, userId }) });
    setTeams(teams.map(t => t.id === teamId ? { ...t, members: t.members.filter((m: any) => m.userId !== userId) } : t));
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Team Management</h1>
          <p className="text-muted-foreground">Manage your team and invite members</p>
        </div>
        <Button onClick={() => setShowCreate(true)} className="bg-orange-500 hover:bg-orange-600"><Users className="w-4 h-4 mr-2" />Create Team</Button>
      </div>

      {showCreate && (
        <Card className="bg-card/50 backdrop-blur">
          <CardContent className="p-4 flex gap-4">
            <Input placeholder="Team name" value={teamName} onChange={e => setTeamName(e.target.value)} className="flex-1" />
            <Button onClick={createTeam} className="bg-orange-500 hover:bg-orange-600">Create</Button>
            <Button variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
          </CardContent>
        </Card>
      )}

      {teams.map(team => (
        <Card key={team.id} className="bg-card/50 backdrop-blur">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2"><Users className="w-5 h-5 text-orange-500" />{team.name}</CardTitle>
              <span className="text-sm text-muted-foreground">{team.members?.length || 0} / {team.memberLimit} members</span>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input placeholder="Invite by email" value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} className="flex-1" />
              <Button onClick={() => inviteMember(team.id)} disabled={!inviteEmail}><UserPlus className="w-4 h-4 mr-2" />Invite</Button>
            </div>
            <div className="space-y-2">
              {team.members?.map((member: any) => (
                <div key={member.userId} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div className="flex items-center gap-3">
                    {member.role === 'owner' ? <Crown className="w-4 h-4 text-yellow-500" /> : <Shield className="w-4 h-4 text-blue-500" />}
                    <div>
                      <p className="text-sm font-medium">{member.user?.name || 'Unknown'}</p>
                      <p className="text-xs text-muted-foreground">{member.user?.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs bg-orange-500/10 text-orange-500 px-2 py-1 rounded">{member.role}</span>
                    {member.role !== 'owner' && <Button variant="ghost" size="sm" onClick={() => removeMember(team.id, member.userId)}><Trash2 className="w-4 h-4 text-red-500" /></Button>}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}

      {teams.length === 0 && !loading && (
        <Card className="bg-card/50 backdrop-blur"><CardContent className="p-12 text-center"><Users className="w-12 h-12 mx-auto text-muted-foreground mb-4" /><p className="text-muted-foreground">No teams yet. Create a team to collaborate with others.</p></CardContent></Card>
      )}
    </div>
  );
}
